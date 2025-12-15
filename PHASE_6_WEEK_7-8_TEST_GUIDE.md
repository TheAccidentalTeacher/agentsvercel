# Phase 6 Week 7-8: Quick Test Guide 🧪

**Ready to test!** Server running at [http://localhost:8888](http://localhost:8888)

---

## 🎯 Quick Test Procedure

### 1. **Do a Research** (if you haven't already)
1. Click "🔬 Deep Research" mode
2. Enter query: "best practices for teaching mathematics"
3. Select 4 personas (or use all 12)
4. Wait for research to complete (~2-8 minutes depending on personas)

### 2. **Save the Research** 💾
1. Look at top-right of research results
2. You'll see 4 new buttons:
   - **💾 Save** - Click this!
3. **Expected**: Green toast appears "💾 Research session saved!"
4. **Verify**: Check browser console (F12) for session ID

### 3. **View History** 📚
1. Click **📚 History** button
2. **Expected**: Modal appears showing your saved session
3. **Verify**: 
   - Session shows your query
   - Metadata: date, result count, analysis count, duration
   - Storage info at top (e.g., "💾 Storage: 234.5 KB (1 sessions)")

### 4. **Export Markdown** 📄
1. Click **📄 Markdown** button
2. **Expected**: File downloads (e.g., `research_1734382800000.md`)
3. **Verify**: Open the file - should have:
   - Query at top
   - Date and personas
   - Executive Summary
   - All expert analyses
   - Extracted content
   - Search results

### 5. **Export JSON** 📋
1. Click **📋 JSON** button
2. **Expected**: File downloads (e.g., `research_1734382800000.json`)
3. **Verify**: Open the file - should be valid JSON with all data

### 6. **Load Saved Session** 📂
1. Click **📚 History** again
2. Click **📂 Load** on your saved session
3. **Expected**: 
   - Modal closes
   - Research results appear
   - Green toast "📂 Session loaded!"

### 7. **Delete Session** 🗑️
1. Click **📚 History**
2. Click **🗑️** button on a session
3. Confirm deletion
4. **Expected**: Session disappears, toast "🗑️ Session deleted"

---

## 🎨 What You'll See

### New Buttons (top-right of research results):
```
💾 Save    📄 Markdown    📋 JSON    📚 History
```

### History Modal:
```
┌─────────────────────────────────────────────────┐
│ 📚 Research History              💾 Storage: ... │
│                                            ✖️    │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │ Query: "best practices for teaching..."  │  │
│  │ 📅 12/16/2024 8:30 PM                    │  │
│  │ 📊 9 results  🤖 4 analyses  ⏱️ 481s    │  │
│  │                      📂 Load    🗑️        │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
├─────────────────────────────────────────────────┤
│           🗑️ Clear All History                  │
└─────────────────────────────────────────────────┘
```

### Toast Notifications (top-right corner):
```
┌──────────────────────────┐
│ 💾 Research session saved! │  (Green)
└──────────────────────────┘

┌──────────────────────────┐
│ 📄 Markdown exported!     │  (Green)
└──────────────────────────┘
```

---

## 🐛 If Something Goes Wrong

### Check Browser Console (F12):
- Look for errors (red text)
- Check for success logs (green ✅)
- Look for session IDs

### Common Issues:
1. **Buttons not appearing**: Refresh page, do a new research
2. **Modal not opening**: Check console for errors
3. **Export not downloading**: Check browser download settings
4. **localStorage full**: Click "🗑️ Clear All History" to free space

---

## 📊 What Gets Saved

### Session Data Structure:
```javascript
{
  id: "research_1734382800000",
  query: "best practices for teaching mathematics",
  timestamp: "2024-12-16T20:30:00.000Z",
  personas: ["master-teacher", "strategist", ...],
  results: [...],          // All search results
  extractedContent: [...], // Extracted web pages
  chunks: [...],          // LLM chunks
  analysis: {...},        // Multi-agent analyses
  metadata: {
    resultCount: 9,
    extractedCount: 3,
    analysisCount: 4,
    duration: 481923
  }
}
```

---

## 🎉 Success Indicators

✅ **Save works**: Green toast + session appears in history  
✅ **Load works**: Research results restored, all content visible  
✅ **Export works**: Files download with proper formatting  
✅ **Delete works**: Session removed from history  
✅ **Modal works**: Opens/closes smoothly, click outside to close  
✅ **Toasts work**: Appear, auto-dismiss after 3 seconds  

---

## 🚀 Next Steps After Testing

If everything works:
1. Try saving multiple research sessions
2. Test with different persona counts (4 vs 12)
3. Export both Markdown and JSON
4. Load old sessions to verify data persistence
5. Clear history when done testing

If there are issues:
1. Note the specific error or unexpected behavior
2. Check browser console for error messages
3. Let me know what's not working
4. We'll debug together!

---

**Ready? Go test!** 🎯

Server: http://localhost:8888  
Mode: 🔬 Deep Research  
Features: 💾 Save, 📄 Markdown, 📋 JSON, 📚 History
