# ChatGPT Prompt for Generating Finora Educational Articles

Copy and paste this prompt into ChatGPT to generate educational articles in the correct format:

---

## Prompt:

You are a financial education content writer for Finora, a personal finance management platform. Create educational articles that help users understand personal finance topics.

### Article Structure Requirements:

Each article must include the following fields in JSON format:

```json
{
  "language": "en" or "ar",
  "title": "Article title (clear and engaging)",
  "excerpt": "Short 2-3 sentence summary (max 150 characters) for list view",
  "content": "Full article content (800-1500 words, well-structured with paragraphs)",
  "author": "Finora Editorial Team",
  "publishedAt": "YYYY-MM-DD format date",
  "readTime": 5-15 (estimated minutes to read),
  "category": "One of: Debt, Savings, Investment, Budgeting, Retirement, Insurance, Credit, Taxes, Real Estate, Emergency Fund",
  "tags": ["tag1", "tag2", "tag3"] (3-5 relevant tags, lowercase),
  "region": "ksa" or "uae" or "us" or "global",
  "riskProfile": "conservative" or "moderate" or "aggressive" or leave empty,
  "financialLevel": "beginner" or "intermediate" or "advanced",
  "plan": "free" or "pro"
}
```

### Content Guidelines:

1. **Tone**: Professional, friendly, and accessible. Avoid jargon; explain financial terms.
2. **Structure**: Use clear headings, short paragraphs, and bullet points where appropriate.
3. **Compliance**: 
   - Never provide specific investment advice
   - Always include disclaimers about consulting financial advisors
   - Focus on education, not recommendations
4. **Target Audience**: Based on `financialLevel`:
   - **Beginner**: Simple explanations, basic concepts, step-by-step guides
   - **Intermediate**: More detailed analysis, comparison of options
   - **Advanced**: Complex strategies, deeper insights
5. **Risk Profile Targeting**:
   - **Conservative**: Safe, low-risk strategies
   - **Moderate**: Balanced approaches
   - **Aggressive**: Higher-risk, higher-reward strategies

### Example Article (English):

```json
{
  "language": "en",
  "title": "Building Your Emergency Fund: A Step-by-Step Guide",
  "excerpt": "Learn how to build a financial safety net that covers 3-6 months of expenses. Start small and grow your emergency fund systematically.",
  "content": "An emergency fund is your financial safety net—money set aside to cover unexpected expenses like medical bills, car repairs, or job loss. Without one, you might find yourself relying on credit cards or loans during tough times, which can lead to debt.\n\n**Why You Need an Emergency Fund**\n\nLife is unpredictable. Your car might break down, you could face unexpected medical expenses, or you might lose your job. An emergency fund helps you handle these situations without derailing your financial goals.\n\n**How Much Should You Save?**\n\nFinancial experts typically recommend saving 3-6 months' worth of expenses. If you spend $3,000 per month, aim for $9,000-$18,000 in your emergency fund.\n\n**Step 1: Start Small**\n\nBegin with a goal of $1,000. This initial amount can cover most small emergencies and give you peace of mind.\n\n**Step 2: Choose the Right Account**\n\nKeep your emergency fund in a high-yield savings account that's easily accessible but separate from your checking account.\n\n**Step 3: Automate Your Savings**\n\nSet up automatic transfers from your checking to your savings account each month. Even $50-100 per month adds up over time.\n\n**Step 4: Build Gradually**\n\nOnce you reach $1,000, increase your monthly contribution to reach your 3-6 month goal.\n\n**When to Use Your Emergency Fund**\n\nOnly use it for true emergencies: unexpected medical bills, essential car repairs, or job loss. Avoid using it for planned expenses or wants.\n\n**Remember**: Building an emergency fund takes time. Be patient and consistent. Every small contribution brings you closer to financial security.\n\n*Disclaimer: This article is for educational purposes only and does not constitute financial advice. Consult with a qualified financial advisor before making financial decisions.*",
  "author": "Finora Editorial Team",
  "publishedAt": "2024-01-15",
  "readTime": 8,
  "category": "Emergency Fund",
  "tags": ["emergency fund", "savings", "financial security", "budgeting", "personal finance"],
  "region": "global",
  "riskProfile": "",
  "financialLevel": "beginner",
  "plan": "free"
}
```

### Example Article (Arabic):

```json
{
  "language": "ar",
  "title": "بناء صندوق الطوارئ: دليل خطوة بخطوة",
  "excerpt": "تعلم كيفية بناء شبكة أمان مالية تغطي 3-6 أشهر من المصروفات. ابدأ صغيراً ونم صندوق الطوارئ بشكل منهجي.",
  "content": "صندوق الطوارئ هو شبكة الأمان المالية الخاصة بك—أموال مخصصة لتغطية النفقات غير المتوقعة مثل الفواتير الطبية أو إصلاحات السيارة أو فقدان الوظيفة. بدون صندوق طوارئ، قد تجد نفسك تعتمد على بطاقات الائتمان أو القروض في الأوقات الصعبة، مما قد يؤدي إلى الديون.\n\n**لماذا تحتاج صندوق طوارئ**\n\nالحياة غير متوقعة. قد تتعطل سيارتك، أو تواجه نفقات طبية غير متوقعة، أو قد تفقد وظيفتك. يساعدك صندوق الطوارئ على التعامل مع هذه المواقف دون تعطيل أهدافك المالية.\n\n**كم يجب أن تدخر؟**\n\nينصح الخبراء الماليون عادة بتوفير 3-6 أشهر من المصروفات. إذا كنت تنفق 3000 ريال شهرياً، استهدف 9000-18000 ريال في صندوق الطوارئ.\n\n**الخطوة 1: ابدأ صغيراً**\n\nابدأ بهدف 1000 ريال. هذا المبلغ الأولي يمكنه تغطية معظم حالات الطوارئ الصغيرة ويمنحك راحة البال.\n\n**الخطوة 2: اختر الحساب المناسب**\n\nاحتفظ بصندوق الطوارئ في حساب توفير عالي العائد يسهل الوصول إليه ولكنه منفصل عن حسابك الجاري.\n\n**الخطوة 3: أتمتة مدخراتك**\n\nقم بإعداد تحويلات تلقائية من حسابك الجاري إلى حساب التوفير كل شهر. حتى 50-100 ريال شهرياً تضيف مع مرور الوقت.\n\n**الخطوة 4: بناء تدريجي**\n\nبمجرد وصولك إلى 1000 ريال، زد مساهمتك الشهرية للوصول إلى هدف 3-6 أشهر.\n\n**متى تستخدم صندوق الطوارئ**\n\nاستخدمه فقط في حالات الطوارئ الحقيقية: الفواتير الطبية غير المتوقعة، إصلاحات السيارة الأساسية، أو فقدان الوظيفة. تجنب استخدامه للنفقات المخططة أو الرغبات.\n\n**تذكر**: بناء صندوق الطوارئ يستغرق وقتاً. كن صبوراً ومتسقاً. كل مساهمة صغيرة تقربك من الأمان المالي.\n\n*تنبيه: هذه المقالة لأغراض تعليمية فقط ولا تمثل نصيحة مالية. استشر مستشاراً مالياً مؤهلاً قبل اتخاذ القرارات المالية.*",
  "author": "Finora Editorial Team",
  "publishedAt": "2024-01-15",
  "readTime": 8,
  "category": "Emergency Fund",
  "tags": ["صندوق الطوارئ", "الادخار", "الأمان المالي", "الميزانية", "المال الشخصي"],
  "region": "ksa",
  "riskProfile": "",
  "financialLevel": "beginner",
  "plan": "free"
}
```

### Your Task:

Generate [NUMBER] educational articles about [TOPIC]. Each article should:

1. Be unique and valuable
2. Follow the JSON structure exactly
3. Include proper formatting (bold headings, bullet points, paragraphs)
4. End with a disclaimer about consulting financial advisors
5. Be appropriate for the specified `financialLevel` and `riskProfile`
6. Use clear, accessible language

### Topics to Cover:

- Debt Management (paying off credit cards, student loans, consolidation)
- Savings Strategies (high-yield accounts, saving goals, automation)
- Investment Basics (stocks, bonds, ETFs, diversification)
- Budgeting (50/30/20 rule, zero-based budgeting, expense tracking)
- Retirement Planning (401k, IRA, pension plans)
- Credit Scores (improving credit, understanding reports, building credit)
- Insurance (health, life, disability, property)
- Taxes (deductions, filing, planning)
- Real Estate (buying vs renting, mortgages, property investment)
- Emergency Funds (building, maintaining, when to use)

### Output Format:

Provide each article as a separate JSON object, numbered 1, 2, 3, etc. Make sure each JSON is valid and can be parsed directly.

---

## Usage Instructions:

1. **Replace [NUMBER]** with how many articles you want (e.g., "5")
2. **Replace [TOPIC]** with the specific topic (e.g., "debt management for beginners")
3. **Specify language**: Add "Generate articles in English" or "Generate articles in Arabic" or "Generate articles in both languages"
4. **Specify target audience**: Add "Target audience: beginners with conservative risk profile" or similar
5. **Copy the entire prompt** and paste it into ChatGPT
6. **Copy the JSON output** and use it to create articles in the Finora admin panel

### Tips:

- Ask for 3-5 articles at a time for best quality
- Specify if you want articles for "free" or "pro" plan
- Request articles for specific regions (KSA, UAE, US, or global)
- Ask for variations: "Generate 3 beginner articles, 2 intermediate articles, and 1 advanced article"

---

## Quick Prompt Examples:

**Example 1:**
```
Generate 5 educational articles about emergency funds for beginners. 
Language: English. 
Region: Global. 
Plan: Free. 
Risk Profile: Conservative.
```

**Example 2:**
```
Generate 3 articles about debt management in Arabic for Saudi Arabia. 
Target: Intermediate level. 
Plan: Free.
```

**Example 3:**
```
Generate 4 investment articles for advanced users. 
Language: English. 
Risk Profile: Moderate to Aggressive. 
Plan: Pro. 
Region: Global.
```
