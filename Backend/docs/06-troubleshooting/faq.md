# FAQ - Frequently Asked Questions

Quick answers to common questions about ChatTax Backend.

## General Questions

### What is ChatTax?

ChatTax is an AI-powered Australian tax assistant that uses RAG (Retrieval-Augmented Generation) to answer tax questions based on 3,246 official ATO documents.

### Who can use ChatTax?

ChatTax is designed **exclusively for Australian individual taxpayers**. It does not support:
- U.S. tax law
- Business/company tax
- International tax
- Professional/accountant workflows

### Is ChatTax free?

The backend is open-source (MIT license). However, you need:
- OpenAI API key (paid service)
- Server hosting (can be free for development)

### Can I use it offline?

No. ChatTax requires:
- Internet connection to OpenAI API
- Running backend server
- FAISS index loaded in memory

---

## Technical Questions

### What technologies does ChatTax use?

**Backend**:
- FastAPI (web framework)
- FAISS (vector search)
- OpenAI GPT-4o-mini (LLM)
- SQLAlchemy (database)
- sentence-transformers (embeddings)

**Data**:
- 3,246 Australian tax documents
- 384-dimensional embeddings
- Parquet metadata storage

### How does the RAG system work?

1. User asks question
2. Question → 384-dim embedding vector
3. FAISS finds similar document chunks
4. (Optional) Rerank with cross-encoder
5. Retrieved docs → context for GPT-4o-mini
6. GPT generates answer with citations

### What's the difference between with/without reranking?

| Feature | Without Reranking | With Reranking |
|---------|-------------------|----------------|
| Speed | Fast (~500ms) | Slower (~700ms) |
| Accuracy | Good | Excellent |
| Documents | Top 5 from FAISS | Top 5 after reranking 20 |
| Use Case | Quick queries | Complex questions |

### How accurate are the answers?

Accuracy depends on:
- **Question clarity**: Specific questions get better answers
- **Document coverage**: 3,246 documents cover common tax topics
- **Relevance scores**: Higher scores (>0.7) indicate better matches
- **Confidence**: System provides confidence score (0-1)

**Best practices**:
- Ask specific questions about Australian personal tax
- Review source citations
- Check confidence scores
- Verify with official ATO sources for critical decisions

---

## Installation Questions

### What Python version do I need?

**Recommended**: Python 3.11 or 3.12

**Supported**: Python 3.8+

**Not Recommended**: Python 3.13 (PyArrow compatibility issues on Windows)

### Why can't I install PyArrow?

PyArrow requires compilation on Windows. Solutions:
1. Use Python 3.11/3.12 instead of 3.13
2. Install precompiled wheel: `pip install pyarrow --prefer-binary`
3. Use CSV instead of Parquet for metadata

See [Common Issues - PyArrow Installation](./common-issues.md#pyarrow-installation-failure)

### Do I need a GPU?

No. ChatTax uses:
- FAISS-CPU (no GPU needed)
- CPU-based embeddings
- OpenAI API (cloud-based)

GPU would only help if running local LLM instead of OpenAI.

### How much RAM do I need?

**Minimum**: 2GB
- FAISS index: ~5MB
- Embedder model: ~80MB
- Python + dependencies: ~500MB
- OS overhead: ~1GB

**Recommended**: 4GB+ for comfortable operation

### Can I use a different database?

Yes! Supports:
- **SQLite** (default): Easy setup, development
- **PostgreSQL** (recommended): Production, multi-user
- **MySQL**: Alternative production option

Change `DATABASE_URL` in `.env`

---

## Usage Questions

### What questions can I ask?

**Good questions**:
- "What is the tax-free threshold in Australia?"
- "Can I claim home office expenses?"
- "What are the tax offsets for low income earners?"
- "How do I claim work-related car expenses?"

**Bad questions**:
- "How do I pay less tax?" (too vague)
- "U.S. tax deductions" (wrong country)
- "Company tax rates" (business tax, not individual)
- "Should I invest in stocks?" (not tax-specific)

### Why are my answers generic?

**Possible causes**:
1. **Question too broad**: Be more specific
2. **Low relevance scores**: Question outside tax domain
3. **Wrong context retrieved**: Check `sources` in response
4. **Model temperature too high**: Should be 0.3 (default)

**Solutions**:
- Ask specific questions about Australian tax
- Review retrieved sources
- Check confidence scores
- Rephrase question if needed

### Can I customize the checklist?

Yes! Checklist adapts to:
- Employment status (employed, self-employed, etc.)
- Income sources (salary, investment, rental, etc.)
- Dependents, investments, rental properties
- Location (Australian states)
- Additional context

**Complexity levels**:
- Simple (3-4 factors): 5-8 items
- Moderate (5-6 factors): 8-12 items
- Complex (7+ factors): 12-15 items

### How do I get better checklist results?

Provide detailed `identity_info`:
```json
{
  "employment_status": "employed",
  "income_sources": ["salary", "investment", "rental"],
  "has_dependents": true,
  "has_investment": true,
  "has_rental_property": true,
  "is_first_time_filer": false,
  "additional_info": {
    "industry": "technology",
    "location": "NSW",
    "work_from_home": true,
    "overseas_income": false
  }
}
```

---

## Performance Questions

### Why are queries slow?

**Typical query times**:
- FAISS search: 5-10ms
- Reranking (if enabled): 200ms
- OpenAI API: 500-2000ms
- **Total**: 1-3 seconds

**If slower than 5 seconds**:
1. Check internet connection to OpenAI
2. Disable reranking: `"use_reranking": false`
3. Reduce `top_k`: Use 3 instead of 5
4. Check OpenAI API status

### Can I make it faster?

**Options**:
1. **Disable reranking**: Saves ~200ms
2. **Reduce top_k**: Fewer documents to process
3. **Use faster OpenAI model**: Already using gpt-4o-mini (fastest)
4. **Cache results**: Implement Redis caching (not included)
5. **CDN for frontend**: Reduce network latency

### How many requests can it handle?

**Development (single worker)**:
- ~10-20 requests/second (non-RAG endpoints)
- ~2-5 RAG queries/second (limited by OpenAI API)

**Production (4 workers)**:
- ~40-80 requests/second (non-RAG)
- ~8-20 RAG queries/second

**Bottlenecks**:
- OpenAI API rate limits
- Database connections (if SQLite)
- Network bandwidth

---

## Data Questions

### Where does the tax data come from?

All 3,246 documents are from official Australian Taxation Office (ATO) sources:
- www.ato.gov.au
- Official ATO publications
- Tax guidelines and regulations

Each source includes:
- Original URL
- Crawl date
- Last updated date
- Provenance information

### How recent is the data?

Check `crawl_date` in response sources. Data is from:
- Most recent ATO updates (as of crawl date)
- Tax year information varies by document
- Regular updates needed to stay current

**Recommendation**: Always verify critical information with current ATO website.

### Can I add my own documents?

Yes, but requires rebuilding FAISS index:

1. Prepare documents (text format)
2. Chunk into segments
3. Generate embeddings (all-MiniLM-L6-v2)
4. Add to FAISS index
5. Update metadata
6. Rebuild index files

See [Database Management](../05-database/database-management.md) for details.

### How do I update the tax documents?

**Full rebuild**:
1. Crawl new documents from ATO
2. Chunk and embed documents
3. Build new FAISS index
4. Create new metadata.parquet
5. Replace index files
6. Restart server

**Note**: Index building scripts not included in this release.

---

## Security Questions

### Is my data secure?

**What's stored**:
- User accounts (hashed passwords)
- Chat history (optional, not currently implemented)
- Generated checklists

**What's NOT stored**:
- Tax questions (unless you implement logging)
- Personal tax information
- OpenAI API responses (unless cached)

**Security measures**:
- Bcrypt password hashing
- JWT authentication
- HTTPS (in production)
- Environment variables for secrets

### Can I use it in production?

Yes, but:
1. ✅ Change SECRET_KEY to strong random value
2. ✅ Use HTTPS
3. ✅ Use PostgreSQL/MySQL (not SQLite)
4. ✅ Enable rate limiting
5. ✅ Regular backups
6. ✅ Monitor OpenAI usage/costs
7. ✅ Update dependencies regularly
8. ⚠️ Review data privacy laws (GDPR, privacy act)
9. ⚠️ Add disclaimer (not professional tax advice)

### How do I protect my OpenAI API key?

1. **Never commit to git**: Add `.env` to `.gitignore`
2. **Use environment variables**: Don't hardcode in code
3. **Rotate keys regularly**: Generate new keys periodically
4. **Monitor usage**: Check OpenAI dashboard
5. **Set spending limits**: Prevent unexpected bills
6. **Restrict IP** (if possible): OpenAI API key restrictions

---

## Cost Questions

### How much does it cost to run?

**Development**:
- Backend: Free (local)
- OpenAI API: ~$0.15 per 1M tokens (GPT-4o-mini)
- Typical query: ~1,000 tokens = $0.0002

**Production**:
- Server: $5-50/month (depends on hosting)
- OpenAI API: Varies with usage
- Database: Free (PostgreSQL) or $7-15/month (managed)

**Example usage**:
- 1,000 queries/day = $0.20/day = $6/month (OpenAI only)
- 10,000 queries/day = $2/day = $60/month

### Can I reduce OpenAI costs?

**Strategies**:
1. **Cache common queries**: Store frequent Q&A
2. **Reduce top_k**: Fewer documents = fewer tokens
3. **Shorter prompts**: Optimize system prompts
4. **Batch processing**: Process multiple queries together
5. **Set max_tokens**: Limit response length
6. **Monitor usage**: Track costs daily

### Are there free alternatives to OpenAI?

**Open-source LLMs**:
- Llama 2/3 (Meta)
- Mistral
- Falcon

**Pros**: Free, self-hosted
**Cons**: Need GPU, more complex setup, lower quality

**Recommendation**: Start with OpenAI for simplicity and quality.

---

## Deployment Questions

### Can I deploy to cloud?

Yes! Compatible with:
- **Heroku**: Easy deployment
- **AWS EC2/ECS**: Flexible, scalable
- **Google Cloud Run**: Serverless
- **DigitalOcean**: Simple droplets
- **Azure**: Enterprise options

### Do I need Docker?

Not required, but recommended for production:
- Consistent environment
- Easy deployment
- Scalability
- Isolation

### How do I deploy with multiple workers?

```powershell
# Use PostgreSQL/MySQL (not SQLite)
DATABASE_URL=postgresql://...

# Run with multiple workers
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Important**: SQLite doesn't support multiple workers!

---

## Contributing Questions

### Can I contribute?

Yes! Contributions welcome:
- Bug fixes
- Feature enhancements
- Documentation improvements
- Test coverage
- Performance optimizations

See [Contributing Guidelines](../04-development/contributing.md) *(coming soon)*

### How do I report bugs?

1. Check [Common Issues](./common-issues.md) first
2. Search existing GitHub Issues
3. Create new issue with:
   - Python version
   - Error message + traceback
   - Steps to reproduce
   - Expected vs actual behavior

### Can I fork and modify?

Yes! MIT License allows:
- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use

**Requirements**:
- Include original license
- Include copyright notice

---

## Need More Help?

- **Installation issues**: [Installation Guide](../01-getting-started/installation.md)
- **Configuration questions**: [Configuration Guide](../01-getting-started/configuration.md)
- **API questions**: [API Documentation](../03-api/endpoints.md)
- **Error messages**: [Common Issues](./common-issues.md)
- **Database problems**: [Database Management](../05-database/database-management.md)
