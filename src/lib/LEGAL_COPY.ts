/**
 * LEGAL_COPY - Centralized Legal and Regulatory Disclosures
 * 
 * This file contains all legal text for Finora's regulatory compliance.
 * All legal pages pull content from this centralized source.
 * 
 * IMPORTANT: This content is defensive and compliance-focused.
 * - Finora is NOT a bank
 * - NOT licensed by SAMA
 * - AI insights are informational only
 * - Avoids restricted financial terms
 */

import { Language } from "@/components/LanguageProvider";

export const LEGAL_COPY = {
  en: {
    // ===== DISCLAIMER =====
    disclaimer: {
      title: "Legal Disclaimer",
      lastUpdated: "2024",
      sections: [
        {
          heading: "Not a Financial Institution",
          content: `Finora is a financial technology platform that provides informational tools and educational resources. Finora is NOT a bank, credit union, or financial institution. Finora is NOT licensed, regulated, or supervised by the Saudi Arabian Monetary Authority (SAMA) or any other financial regulatory body.`,
        },
        {
          heading: "No Banking Services",
          content: `Finora does not provide banking services, accept deposits, extend credit, or facilitate money transfers between parties. Finora does not hold customer funds, process payments on behalf of third parties, or engage in any activities that would require banking or payment services licensing.`,
        },
        {
          heading: "Informational Purpose Only",
          content: `All financial data, insights, charts, and analysis provided by Finora are for informational and educational purposes only. The information presented is based on data you provide and should not be construed as financial, investment, tax, or legal advice.`,
        },
        {
          heading: "AI-Generated Content",
          content: `AI-generated insights, recommendations, and responses are produced by automated systems and are informational only. These insights are not personalized financial advice, investment recommendations, or professional financial planning services. AI responses may contain errors, inaccuracies, or outdated information.`,
        },
        {
          heading: "No Guarantees",
          content: `Finora makes no representations, warranties, or guarantees regarding the accuracy, completeness, reliability, or suitability of any information, data, or insights provided through the platform. Past performance, trends, or projections do not guarantee future results.`,
        },
        {
          heading: "Professional Advice Required",
          content: `You should consult with qualified financial advisors, accountants, tax professionals, or legal counsel before making any financial decisions. Finora's tools and information are not a substitute for professional financial advice tailored to your specific circumstances.`,
        },
        {
          heading: "User Responsibility",
          content: `You are solely responsible for all financial decisions you make. Finora is not liable for any losses, damages, or consequences arising from your use of the platform or reliance on any information, insights, or recommendations provided.`,
        },
        {
          heading: "Data Accuracy",
          content: `You are responsible for the accuracy of all financial data you enter into the platform. Finora is not responsible for errors in calculations, analysis, or insights that result from inaccurate or incomplete data you provide.`,
        },
        {
          heading: "No Endorsement",
          content: `Any references to financial products, services, institutions, or strategies are for informational purposes only and do not constitute an endorsement, recommendation, or solicitation.`,
        },
        {
          heading: "Regulatory Compliance",
          content: `Finora operates in compliance with applicable laws and regulations. However, financial regulations vary by jurisdiction and may change. You are responsible for ensuring your use of Finora complies with all applicable laws in your jurisdiction.`,
        },
      ],
      footerNote: {
        heading: "Important",
        content: `Please read this disclaimer carefully. By using Finora, you acknowledge that you have read, understood, and agree to be bound by this disclaimer.`,
      },
      backLink: "← Back to Home",
      lastUpdatedLabel: "Last updated:",
    },

    // ===== TERMS OF SERVICE =====
    terms: {
      title: "Terms of Service",
      lastUpdated: "2024",
      sections: [
        {
          heading: "Acceptance of Terms",
          content: `By accessing or using Finora, you agree to be bound by these Terms of Service. If you do not agree to these terms, you must not use the platform.`,
        },
        {
          heading: "Description of Service",
          content: `Finora is a financial technology platform that provides tools for tracking, analyzing, and understanding personal financial data. The platform includes features such as financial dashboards, expense tracking, savings analysis, and AI-powered informational insights.`,
        },
        {
          heading: "Eligibility",
          content: `You must be at least 18 years old and have the legal capacity to enter into binding agreements to use Finora. By using the platform, you represent and warrant that you meet these eligibility requirements.`,
        },
        {
          heading: "Account Registration",
          content: `You are responsible for maintaining the confidentiality of your account credentials. You agree to notify Finora immediately of any unauthorized access to your account. You are responsible for all activities that occur under your account.`,
        },
        {
          heading: "User Data and Privacy",
          content: `You retain ownership of all data you provide to Finora. By using the platform, you grant Finora a license to use, store, and process your data solely for the purpose of providing and improving the service. See our Privacy Policy for details.`,
        },
        {
          heading: "Prohibited Uses",
          content: `You agree not to: (a) use Finora for any illegal purpose; (b) attempt to gain unauthorized access to the platform; (c) interfere with or disrupt the service; (d) use automated systems to access the platform without authorization; (e) reverse engineer or attempt to extract source code; (f) use the platform to transmit malicious code or harmful content.`,
        },
        {
          heading: "Subscription and Payments",
          content: `Finora offers subscription plans with different features and limitations. Subscription fees are charged in advance. All fees are non-refundable except as required by law. Finora reserves the right to change pricing with 30 days' notice.`,
        },
        {
          heading: "Intellectual Property",
          content: `All content, features, and functionality of Finora, including but not limited to text, graphics, logos, software, and AI models, are owned by Finora or its licensors and are protected by copyright, trademark, and other intellectual property laws.`,
        },
        {
          heading: "Termination",
          content: `Finora reserves the right to suspend or terminate your account at any time for violation of these terms or for any other reason. You may cancel your subscription at any time, but you will not receive a refund for any unused portion of your subscription period.`,
        },
        {
          heading: "Limitation of Liability",
          content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, FINORA SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.`,
        },
        {
          heading: "Disclaimer of Warranties",
          content: `FINORA IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.`,
        },
        {
          heading: "Indemnification",
          content: `You agree to indemnify, defend, and hold harmless Finora, its affiliates, officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the platform or violation of these terms.`,
        },
        {
          heading: "Governing Law",
          content: `These Terms of Service shall be governed by and construed in accordance with the laws of the Kingdom of Saudi Arabia, without regard to its conflict of law provisions.`,
        },
        {
          heading: "Changes to Terms",
          content: `Finora reserves the right to modify these terms at any time. Material changes will be communicated via email or platform notification. Your continued use of the platform after changes become effective constitutes acceptance of the modified terms.`,
        },
        {
          heading: "Contact Information",
          content: `For questions about these Terms of Service, please contact us through the support channels provided in the platform.`,
        },
      ],
      footerNote: {
        heading: "Agreement",
        content: `By using Finora, you agree to be bound by these Terms of Service. If you do not agree, you must not use the platform.`,
      },
      backLink: "← Back to Home",
      lastUpdatedLabel: "Last updated:",
    },

    // ===== PRIVACY POLICY =====
    privacy: {
      title: "Privacy Policy",
      lastUpdated: "2024",
      sections: [
        {
          heading: "Introduction",
          content: `Finora ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our financial technology platform.`,
        },
        {
          heading: "Information We Collect",
          content: `We collect information you provide directly, including: (a) account registration information (name, email); (b) financial data you enter (income, expenses, savings, net worth); (c) preferences and settings; (d) subscription and payment information. We also collect technical information automatically, including device information, IP address, browser type, and usage data.`,
        },
        {
          heading: "How We Use Your Information",
          content: `We use your information to: (a) provide and maintain the platform; (b) process transactions and manage subscriptions; (c) generate insights and analysis based on your data; (d) communicate with you about the service; (e) improve and develop new features; (f) detect and prevent fraud or abuse; (g) comply with legal obligations.`,
        },
        {
          heading: "Data Storage and Security",
          content: `Your data is stored securely using industry-standard encryption and security measures. We use third-party cloud services that comply with applicable data protection regulations. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.`,
        },
        {
          heading: "Data Sharing and Disclosure",
          content: `We do not sell your personal or financial data. We may share your information only: (a) with service providers who assist in operating the platform (under strict confidentiality agreements); (b) when required by law or legal process; (c) to protect our rights or the safety of users; (d) in connection with a business transfer (with notice).`,
        },
        {
          heading: "Third-Party Services",
          content: `Finora integrates with third-party services for authentication (Clerk), payment processing (Moyasar), and AI services (OpenAI). These services have their own privacy policies. We encourage you to review their policies.`,
        },
        {
          heading: "Data Retention",
          content: `We retain your data for as long as your account is active or as needed to provide services. You may request deletion of your account and data at any time. Some information may be retained for legal, regulatory, or business purposes even after account deletion.`,
        },
        {
          heading: "Your Rights",
          content: `You have the right to: (a) access your personal data; (b) correct inaccurate data; (c) request deletion of your data; (d) object to processing of your data; (e) request data portability; (f) withdraw consent where processing is based on consent. To exercise these rights, contact us through the platform's support channels.`,
        },
        {
          heading: "Cookies and Tracking",
          content: `We use cookies and similar technologies to enhance your experience, analyze usage, and personalize content. You can control cookies through your browser settings, but disabling cookies may limit platform functionality.`,
        },
        {
          heading: "Children's Privacy",
          content: `Finora is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child, we will take steps to delete it.`,
        },
        {
          heading: "International Data Transfers",
          content: `Your data may be processed and stored in servers located outside the Kingdom of Saudi Arabia. By using Finora, you consent to the transfer of your data to these locations. We ensure appropriate safeguards are in place for such transfers.`,
        },
        {
          heading: "Changes to Privacy Policy",
          content: `We may update this Privacy Policy from time to time. Material changes will be communicated via email or platform notification. Your continued use of the platform after changes become effective constitutes acceptance of the modified policy.`,
        },
        {
          heading: "Contact Us",
          content: `For questions about this Privacy Policy or to exercise your privacy rights, please contact us through the support channels provided in the platform.`,
        },
      ],
      footerNote: {
        heading: "Your Privacy Matters",
        content: `We are committed to protecting your personal and financial data. If you have questions about this policy or wish to exercise your privacy rights, please contact us through the platform's support channels.`,
      },
      backLink: "← Back to Home",
      lastUpdatedLabel: "Last updated:",
    },

    // ===== FOOTER DISCLAIMER (Short Version) =====
    footerDisclaimer: `Finora is not a bank and is not licensed by SAMA. All information and AI insights are for informational purposes only and do not constitute financial advice.`,
    footerLinks: {
      disclaimer: "Disclaimer",
      terms: "Terms of Service",
      privacy: "Privacy Policy",
      infrastructure: "Infrastructure",
    },
    footerCopyright: `© {year} Finora. All rights reserved.`,
  },

  ar: {
    // ===== DISCLAIMER =====
    disclaimer: {
      title: "إخلاء المسؤولية القانونية",
      lastUpdated: "2024",
      sections: [
        {
          heading: "ليست مؤسسة مالية",
          content: `فينورا هي منصة تكنولوجيا مالية توفر أدوات إعلامية وموارد تعليمية. فينورا ليست بنكًا أو اتحاد ائتماني أو مؤسسة مالية. فينورا غير مرخصة أو منظمة أو خاضعة لإشراف البنك المركزي السعودي (ساما) أو أي هيئة تنظيمية مالية أخرى.`,
        },
        {
          heading: "لا تقدم خدمات مصرفية",
          content: `فينورا لا تقدم خدمات مصرفية أو تقبل الودائع أو تمنح الائتمان أو تسهل تحويلات الأموال بين الأطراف. فينورا لا تحتفظ بأموال العملاء أو تعالج المدفوعات نيابة عن أطراف ثالثة أو تشارك في أي أنشطة تتطلب ترخيص خدمات مصرفية أو دفع.`,
        },
        {
          heading: "لأغراض إعلامية فقط",
          content: `جميع البيانات المالية والرؤى والرسوم البيانية والتحليلات التي توفرها فينورا هي لأغراض إعلامية وتعليمية فقط. المعلومات المقدمة تستند إلى البيانات التي تقدمها ولا ينبغي تفسيرها على أنها نصيحة مالية أو استثمارية أو ضريبية أو قانونية.`,
        },
        {
          heading: "المحتوى المولد بالذكاء الاصطناعي",
          content: `الرؤى والتوصيات والردود المولدة بالذكاء الاصطناعي يتم إنتاجها بواسطة أنظمة آلية وهي إعلامية فقط. هذه الرؤى ليست نصيحة مالية مخصصة أو توصيات استثمارية أو خدمات تخطيط مالي احترافية. قد تحتوي ردود الذكاء الاصطناعي على أخطاء أو عدم دقة أو معلومات قديمة.`,
        },
        {
          heading: "لا توجد ضمانات",
          content: `فينورا لا تقدم أي تصريحات أو ضمانات أو ضمانات فيما يتعلق بدقة أو اكتمال أو موثوقية أو ملاءمة أي معلومات أو بيانات أو رؤى مقدمة من خلال المنصة. الأداء السابق أو الاتجاهات أو التوقعات لا تضمن النتائج المستقبلية.`,
        },
        {
          heading: "النصيحة المهنية مطلوبة",
          content: `يجب عليك استشارة المستشارين الماليين المؤهلين أو المحاسبين أو المتخصصين الضريبيين أو المستشارين القانونيين قبل اتخاذ أي قرارات مالية. أدوات ومعلومات فينورا ليست بديلاً عن النصيحة المالية المهنية المصممة خصيصًا لظروفك.`,
        },
        {
          heading: "مسؤولية المستخدم",
          content: `أنت المسؤول الوحيد عن جميع القرارات المالية التي تتخذها. فينورا غير مسؤولة عن أي خسائر أو أضرار أو عواقب ناتجة عن استخدامك للمنصة أو الاعتماد على أي معلومات أو رؤى أو توصيات مقدمة.`,
        },
        {
          heading: "دقة البيانات",
          content: `أنت مسؤول عن دقة جميع البيانات المالية التي تدخلها في المنصة. فينورا غير مسؤولة عن الأخطاء في الحسابات أو التحليلات أو الرؤى الناتجة عن البيانات غير الدقيقة أو غير المكتملة التي تقدمها.`,
        },
        {
          heading: "لا يوجد تأييد",
          content: `أي إشارات إلى المنتجات المالية أو الخدمات أو المؤسسات أو الاستراتيجيات هي لأغراض إعلامية فقط ولا تشكل تأييدًا أو توصية أو دعوة.`,
        },
        {
          heading: "الامتثال التنظيمي",
          content: `تعمل فينورا وفقًا للقوانين واللوائح المعمول بها. ومع ذلك، تختلف اللوائح المالية حسب الولاية القضائية وقد تتغير. أنت مسؤول عن ضمان امتثال استخدامك لفينورا لجميع القوانين المعمول بها في ولايتك القضائية.`,
        },
      ],
      footerNote: {
        heading: "مهم",
        content: `يرجى قراءة هذا الإخلاء بعناية. باستخدام فينورا، فإنك تقر بأنك قد قرأت وفهمت وتوافق على الالتزام بهذا الإخلاء.`,
      },
      backLink: "← العودة إلى الصفحة الرئيسية",
      lastUpdatedLabel: "آخر تحديث:",
    },

    // ===== TERMS OF SERVICE =====
    terms: {
      title: "شروط الخدمة",
      lastUpdated: "2024",
      sections: [
        {
          heading: "قبول الشروط",
          content: `من خلال الوصول إلى فينورا أو استخدامها، فإنك توافق على الالتزام بشروط الخدمة هذه. إذا كنت لا توافق على هذه الشروط، يجب ألا تستخدم المنصة.`,
        },
        {
          heading: "وصف الخدمة",
          content: `فينورا هي منصة تكنولوجيا مالية توفر أدوات لتتبع وتحليل وفهم البيانات المالية الشخصية. تشمل المنصة ميزات مثل لوحات المعلومات المالية وتتبع النفقات وتحليل الادخار والرؤى الإعلامية المدعومة بالذكاء الاصطناعي.`,
        },
        {
          heading: "الأهلية",
          content: `يجب أن تكون على الأقل 18 عامًا ولديك الأهلية القانونية لإبرام اتفاقيات ملزمة لاستخدام فينورا. باستخدام المنصة، فإنك تمثل وتضمن أنك تستوفي متطلبات الأهلية هذه.`,
        },
        {
          heading: "تسجيل الحساب",
          content: `أنت مسؤول عن الحفاظ على سرية بيانات اعتماد حسابك. توافق على إخطار فينورا فورًا بأي وصول غير مصرح به إلى حسابك. أنت مسؤول عن جميع الأنشطة التي تحدث تحت حسابك.`,
        },
        {
          heading: "بيانات المستخدم والخصوصية",
          content: `أنت تحتفظ بملكية جميع البيانات التي تقدمها لفينورا. باستخدام المنصة، تمنح فينورا ترخيصًا لاستخدام وتخزين ومعالجة بياناتك فقط لغرض تقديم وتحسين الخدمة. راجع سياسة الخصوصية الخاصة بنا للتفاصيل.`,
        },
        {
          heading: "الاستخدامات المحظورة",
          content: `توافق على عدم: (أ) استخدام فينورا لأي غرض غير قانوني؛ (ب) محاولة الحصول على وصول غير مصرح به إلى المنصة؛ (ج) التدخل في الخدمة أو تعطيلها؛ (د) استخدام الأنظمة الآلية للوصول إلى المنصة دون إذن؛ (هـ) عكس هندسة أو محاولة استخراج الكود المصدري؛ (و) استخدام المنصة لنقل كود ضار أو محتوى ضار.`,
        },
        {
          heading: "الاشتراك والمدفوعات",
          content: `تقدم فينورا خطط اشتراك بميزات وقيود مختلفة. يتم تحصيل رسوم الاشتراك مقدمًا. جميع الرسوم غير قابلة للاسترداد إلا كما هو مطلوب بموجب القانون. تحتفظ فينورا بالحق في تغيير الأسعار بإشعار مدته 30 يومًا.`,
        },
        {
          heading: "الملكية الفكرية",
          content: `جميع المحتويات والميزات والوظائف الخاصة بفينورا، بما في ذلك على سبيل المثال لا الحصر النصوص والرسومات والشعارات والبرمجيات ونماذج الذكاء الاصطناعي، مملوكة لفينورا أو المرخصين لها ومحمية بموجب قوانين حقوق النشر والعلامات التجارية والملكية الفكرية الأخرى.`,
        },
        {
          heading: "الإنهاء",
          content: `تحتفظ فينورا بالحق في تعليق أو إنهاء حسابك في أي وقت بسبب انتهاك هذه الشروط أو لأي سبب آخر. يمكنك إلغاء اشتراكك في أي وقت، لكنك لن تحصل على استرداد لأي جزء غير مستخدم من فترة اشتراكك.`,
        },
        {
          heading: "تحديد المسؤولية",
          content: `إلى أقصى حد يسمح به القانون، لن تكون فينورا مسؤولة عن أي أضرار غير مباشرة أو عرضية أو خاصة أو تبعية أو عقابية، أو أي خسارة في الأرباح أو الإيرادات، سواء تم تكبدها مباشرة أو غير مباشرة، أو أي خسارة في البيانات أو الاستخدام أو السمعة التجارية أو الخسائر غير الملموسة الأخرى.`,
        },
        {
          heading: "إخلاء مسؤولية الضمانات",
          content: `يتم توفير فينورا "كما هي" و"كما هو متاح" دون ضمانات من أي نوع، صريحة أو ضمنية، بما في ذلك على سبيل المثال لا الحصر الضمانات الضمنية للقابلية للتسويق والملاءمة لغرض معين وعدم الانتهاك.`,
        },
        {
          heading: "التعويض",
          content: `توافق على تعويض فينورا والدفاع عنها وإبراء ذمتها من أي مطالبات أو أضرار أو خسائر أو التزامات ونفقات (بما في ذلك الرسوم القانونية) الناشئة عن استخدامك للمنصة أو انتهاك هذه الشروط.`,
        },
        {
          heading: "القانون الحاكم",
          content: `يجب أن تحكم شروط الخدمة هذه وتفسر وفقًا لقوانين المملكة العربية السعودية، دون اعتبار لأحكام قانون النزاع.`,
        },
        {
          heading: "تغييرات الشروط",
          content: `تحتفظ فينورا بالحق في تعديل هذه الشروط في أي وقت. سيتم إبلاغ التغييرات الجوهرية عبر البريد الإلكتروني أو إشعار المنصة. استمرارك في استخدام المنصة بعد أن تصبح التغييرات سارية يعني قبول الشروط المعدلة.`,
        },
        {
          heading: "معلومات الاتصال",
          content: `للأسئلة حول شروط الخدمة هذه، يرجى الاتصال بنا من خلال قنوات الدعم المقدمة في المنصة.`,
        },
      ],
      footerNote: {
        heading: "الاتفاق",
        content: `باستخدام فينورا، فإنك توافق على الالتزام بشروط الخدمة هذه. إذا كنت لا توافق، يجب ألا تستخدم المنصة.`,
      },
      backLink: "← العودة إلى الصفحة الرئيسية",
      lastUpdatedLabel: "آخر تحديث:",
    },

    // ===== PRIVACY POLICY =====
    privacy: {
      title: "سياسة الخصوصية",
      lastUpdated: "2024",
      sections: [
        {
          heading: "مقدمة",
          content: `فينورا ("نحن" أو "خاصتنا" أو "لنا") ملتزمة بحماية خصوصيتك. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وكشف وحماية معلوماتك عند استخدام منصة التكنولوجيا المالية الخاصة بنا.`,
        },
        {
          heading: "المعلومات التي نجمعها",
          content: `نجمع المعلومات التي تقدمها مباشرة، بما في ذلك: (أ) معلومات تسجيل الحساب (الاسم، البريد الإلكتروني)؛ (ب) البيانات المالية التي تدخلها (الدخل، النفقات، المدخرات، صافي القيمة)؛ (ج) التفضيلات والإعدادات؛ (د) معلومات الاشتراك والدفع. نجمع أيضًا المعلومات التقنية تلقائيًا، بما في ذلك معلومات الجهاز وعنوان IP ونوع المتصفح وبيانات الاستخدام.`,
        },
        {
          heading: "كيف نستخدم معلوماتك",
          content: `نستخدم معلوماتك لـ: (أ) توفير وصيانة المنصة؛ (ب) معالجة المعاملات وإدارة الاشتراكات؛ (ج) توليد الرؤى والتحليلات بناءً على بياناتك؛ (د) التواصل معك حول الخدمة؛ (هـ) تحسين وتطوير ميزات جديدة؛ (و) اكتشاف ومنع الاحتيال أو إساءة الاستخدام؛ (ز) الامتثال للالتزامات القانونية.`,
        },
        {
          heading: "تخزين البيانات والأمان",
          content: `يتم تخزين بياناتك بأمان باستخدام التشفير وإجراءات الأمان القياسية في الصناعة. نستخدم خدمات سحابية لطرف ثالث تمتثل للوائح حماية البيانات المعمول بها. ومع ذلك، لا توجد طريقة نقل أو تخزين آمنة بنسبة 100%، ولا يمكننا ضمان الأمان المطلق.`,
        },
        {
          heading: "مشاركة البيانات والكشف",
          content: `لا نبيع بياناتك الشخصية أو المالية. قد نشارك معلوماتك فقط: (أ) مع مقدمي الخدمات الذين يساعدون في تشغيل المنصة (بموجب اتفاقيات سرية صارمة)؛ (ب) عندما يقتضي القانون أو الإجراءات القانونية؛ (ج) لحماية حقوقنا أو سلامة المستخدمين؛ (د) فيما يتعلق بنقل الأعمال (مع إشعار).`,
        },
        {
          heading: "خدمات الطرف الثالث",
          content: `تتكامل فينورا مع خدمات الطرف الثالث للمصادقة (Clerk) ومعالجة المدفوعات (Moyasar) وخدمات الذكاء الاصطناعي (OpenAI). هذه الخدمات لها سياسات خصوصية خاصة بها. نشجعك على مراجعة سياساتها.`,
        },
        {
          heading: "الاحتفاظ بالبيانات",
          content: `نحتفظ ببياناتك طالما أن حسابك نشط أو حسب الحاجة لتقديم الخدمات. يمكنك طلب حذف حسابك وبياناتك في أي وقت. قد يتم الاحتفاظ ببعض المعلومات لأغراض قانونية أو تنظيمية أو تجارية حتى بعد حذف الحساب.`,
        },
        {
          heading: "حقوقك",
          content: `لديك الحق في: (أ) الوصول إلى بياناتك الشخصية؛ (ب) تصحيح البيانات غير الدقيقة؛ (ج) طلب حذف بياناتك؛ (د) الاعتراض على معالجة بياناتك؛ (هـ) طلب نقل البيانات؛ (و) سحب الموافقة حيث تستند المعالجة إلى الموافقة. لممارسة هذه الحقوق، اتصل بنا من خلال قنوات الدعم في المنصة.`,
        },
        {
          heading: "ملفات تعريف الارتباط والتتبع",
          content: `نستخدم ملفات تعريف الارتباط والتقنيات المماثلة لتحسين تجربتك وتحليل الاستخدام وتخصيص المحتوى. يمكنك التحكم في ملفات تعريف الارتباط من خلال إعدادات المتصفح، لكن تعطيل ملفات تعريف الارتباط قد يحد من وظائف المنصة.`,
        },
        {
          heading: "خصوصية الأطفال",
          content: `فينورا غير مخصصة للمستخدمين الذين تقل أعمارهم عن 18 عامًا. لا نجمع معلومات شخصية من الأطفال عن علم. إذا علمنا أننا جمعنا معلومات من طفل، فسنتخذ خطوات لحذفها.`,
        },
        {
          heading: "نقل البيانات الدولية",
          content: `قد يتم معالجة بياناتك وتخزينها في خوادم تقع خارج المملكة العربية السعودية. باستخدام فينورا، فإنك توافق على نقل بياناتك إلى هذه المواقع. نضمن وجود ضمانات مناسبة لمثل هذه التحويلات.`,
        },
        {
          heading: "تغييرات سياسة الخصوصية",
          content: `قد نحدث سياسة الخصوصية هذه من وقت لآخر. سيتم إبلاغ التغييرات الجوهرية عبر البريد الإلكتروني أو إشعار المنصة. استمرارك في استخدام المنصة بعد أن تصبح التغييرات سارية يعني قبول السياسة المعدلة.`,
        },
        {
          heading: "اتصل بنا",
          content: `للأسئلة حول سياسة الخصوصية هذه أو لممارسة حقوق الخصوصية الخاصة بك، يرجى الاتصال بنا من خلال قنوات الدعم المقدمة في المنصة.`,
        },
      ],
      footerNote: {
        heading: "خصوصيتك مهمة",
        content: `نحن ملتزمون بحماية بياناتك الشخصية والمالية. إذا كانت لديك أسئلة حول هذه السياسة أو ترغب في ممارسة حقوق الخصوصية الخاصة بك، يرجى الاتصال بنا من خلال قنوات الدعم في المنصة.`,
      },
      backLink: "← العودة إلى الصفحة الرئيسية",
      lastUpdatedLabel: "آخر تحديث:",
    },

    // ===== FOOTER DISCLAIMER (Short Version) =====
    footerDisclaimer: `فينورا ليست بنكًا وليست مرخصة من قبل البنك المركزي السعودي. جميع المعلومات والرؤى المدعومة بالذكاء الاصطناعي هي لأغراض إعلامية فقط ولا تشكل نصيحة مالية.`,
    footerLinks: {
      disclaimer: "إخلاء المسؤولية",
      terms: "شروط الخدمة",
      privacy: "سياسة الخصوصية",
      infrastructure: "البنية التحتية",
    },
    footerCopyright: `© {year} فينورا. جميع الحقوق محفوظة.`,
  },
} as const;

/**
 * Get legal content by page type and language
 */
export function getLegalContent(
  pageType: "disclaimer" | "terms" | "privacy",
  language: Language = "en"
) {
  return LEGAL_COPY[language][pageType];
}

/**
 * Get footer disclaimer text
 */
export function getFooterDisclaimer(language: Language = "en"): string {
  return LEGAL_COPY[language].footerDisclaimer;
}

/**
 * Get footer link text
 */
export function getFooterLinkText(
  linkType: "disclaimer" | "terms" | "privacy" | "infrastructure",
  language: Language = "en"
): string {
  return LEGAL_COPY[language].footerLinks[linkType];
}

/**
 * Get footer copyright text
 */
export function getFooterCopyright(language: Language = "en"): string {
  const year = new Date().getFullYear();
  return LEGAL_COPY[language].footerCopyright.replace("{year}", year.toString());
}
