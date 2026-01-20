/**
 * Vercel API Route: Memory Save
 * Saves content to memory with automatic embedding generation and tagging
 */

import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 30
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const {
      userId,
      content,
      title,
      contentType = 'manual',
      tags = [],
      autoTag = true,
      metadata = {}
    } = req.body;

    console.log('[Memory Save] Saving memory for user:', userId);

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Generate embedding
    console.log('[Memory Save] Generating embedding...');
    const embedding = await generateEmbedding(content);

    // Auto-generate tags if enabled
    let finalTags = [...tags];
    if (autoTag && finalTags.length === 0) {
      const autoTags = await generateTags(title || '', content);
      finalTags = [...new Set([...finalTags, ...autoTags])];
    }

    // Ensure tags exist
    const tagIds = await ensureTags(supabase, userId, finalTags);

    // Save memory
    const { data: memory, error: insertError } = await supabase
      .from('user_memories')
      .insert({
        user_id: userId,
        content,
        content_type: contentType,
        tags: finalTags,
        embedding,
        metadata: {
          ...metadata,
          title: title || content.substring(0, 100)
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Memory Save] Insert error:', insertError);
      throw new Error(`Failed to save memory: ${insertError.message}`);
    }

    // Link tags to memory
    if (tagIds.length > 0) {
      const tagLinks = tagIds.map(tagId => ({
        memory_id: memory.id,
        tag_id: tagId
      }));
      await supabase.from('memory_tag_links').insert(tagLinks);
    }

    console.log('[Memory Save] Memory saved:', memory.id);

    return res.status(200).json({
      success: true,
      memory: {
        id: memory.id,
        content: memory.content,
        contentType: memory.content_type,
        tags: finalTags,
        createdAt: memory.created_at
      }
    });

  } catch (error) {
    console.error('[Memory Save] Error:', error);
    return res.status(500).json({
      error: 'Failed to save memory',
      details: error.message
    });
  }
}

async function generateEmbedding(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text.substring(0, 8000), // Limit input length
      encoding_format: 'float'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function generateTags(title, content) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return [];
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Generate 3-5 relevant tags for this content. Return ONLY the tags as a comma-separated list, nothing else.

Title: ${title}

Content: ${content.substring(0, 1000)}`
        }]
      })
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const tagsText = data.content[0].text.trim();
    return tagsText.split(',').map(t => t.trim().toLowerCase());

  } catch {
    return [];
  }
}

async function ensureTags(supabase, userId, tagNames) {
  const tagIds = [];

  for (const tagName of tagNames) {
    const { data: existingTag } = await supabase
      .from('memory_tags')
      .select('id')
      .eq('user_id', userId)
      .eq('tag_name', tagName)
      .single();

    if (existingTag) {
      tagIds.push(existingTag.id);
    } else {
      const { data: newTag } = await supabase
        .from('memory_tags')
        .insert({ user_id: userId, tag_name: tagName })
        .select()
        .single();

      if (newTag) {
        tagIds.push(newTag.id);
      }
    }
  }

  return tagIds;
}
