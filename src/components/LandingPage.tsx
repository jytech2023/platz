"use client";

import { useState } from "react";
import Image from "next/image";
import { useI18n } from "@/lib/i18n/context";
import PdfRequestModal from "./PdfRequestModal";

const SALES_CONTENT = {
  en: {
    heroEyebrow: "JIS-certified nursing and hospital beds from Japan",
    heroLead:
      "Built for hospitals, long-term care facilities, and home care teams that need safer transfers, lower fall risk, and clearer clinical justification.",
    heroPrimary: "Get Pricing & Catalogs",
    heroSecondary: "See Clinical Evidence",
    heroSupportTitle: "Fast path for distributors and facility buyers",
    heroSupportPoints: [
      "24-hour response for pricing and bulk inquiries",
      "Catalogs ready for Miolet III, Ardel, and P300 series",
      "Suitable for hospitals, nursing homes, rehab, and home care",
    ],
    trustItems: ["Bulk Procurement", "Distributor Inquiries", "Clinical Evaluation", "Private Label Discussion"],
    productCards: [
      {
        name: "Miolet III",
        badge: "Home Care / Nursing Care Bed",
        description:
          "Vertical lifting design for tight rooms, easier transfers, and safer low-floor care at home or in nursing settings.",
        cover: "/images/catalogs/miolet3-cover.png",
        pdf: "/catalogs/miolet3_catalog_201906.pdf",
        stats: ["15 cm low-floor option", "2 / 3 motors", "Vertical lifting"],
      },
      {
        name: "Ardel",
        badge: "Care Facility Bed",
        description:
          "Advanced care facility bed with patented high back support and electric positioning for broader physical-condition coverage.",
        cover: "/images/catalogs/ardel-cover.png",
        pdf: "/catalogs/ardel_catalog.pdf",
        stats: ["High back support", "2 / 3 motors", "Wheelchair-friendly transfer"],
      },
      {
        name: "P300 Series",
        badge: "Hospital Bed",
        description:
          "Hospital-ready positioning bed designed to improve comfort during back raising while supporting acute-care workflows.",
        cover: "/images/catalogs/p300-cover.png",
        pdf: "/catalogs/P300_catalog_201901.pdf",
        stats: ["31% pressure reduction", "CPR support", "Clinical accessories"],
      },
    ],
    buyerTitle: "What procurement teams ask first",
    buyerItems: [
      {
        title: "Will it reduce patient risk?",
        description: "Low-floor configurations, anti-shear positioning, and high back support help lower fall, aspiration, and bedsore risk.",
      },
      {
        title: "Can caregivers operate it quickly?",
        description: "Universal design handsets, LINAK motors, and bed configurations tailored to clinical and care-facility use keep training overhead low.",
      },
      {
        title: "Does it fit our environment?",
        description: "From tight home rooms to acute-care wards, the lineup covers home care, facility care, rehab, and hospital deployment.",
      },
      {
        title: "Do we have proof for internal approval?",
        description: "Clinical pressure-reduction data and product catalogs make stakeholder review easier for operations, nursing, and procurement teams.",
      },
    ],
    comparisonTitle: "Choose the right series faster",
    comparisonRows: [
      ["Best for", "Home care and nursing care", "Care facilities", "Hospitals and acute care"],
      ["Key strength", "Vertical lifting in small spaces", "Higher-acuity facility care", "Clinical positioning support"],
      ["Motor options", "2 / 3 motors", "2 / 3 motors", "3 motors"],
      ["Why buyers choose it", "Safer home installation and transfer", "Broader patient-condition coverage", "Ward-ready functionality and evidence"],
    ],
    processTitle: "From inquiry to rollout",
    processSteps: [
      { step: "1", title: "Share your use case", description: "Tell us your facility type, target users, and expected order volume." },
      { step: "2", title: "Receive matched catalogs", description: "We send the most relevant series, key specs, and buying guidance." },
      { step: "3", title: "Review pricing and options", description: "Discuss board styles, motor setups, accessories, and delivery scope." },
      { step: "4", title: "Move to evaluation or order", description: "Proceed with distributor discussion, pilot evaluation, or procurement." },
    ],
    resourcesTitle: "Buyer-ready resources",
    resourcesSubtitle: "Use these catalogs for internal review, distributor outreach, or product comparison.",
    resourceCta: "Download PDF",
  },
  zh: {
    heroEyebrow: "来自日本、通过 JIS 认证的护理床与医院床",
    heroLead:
      "面向医院、护理机构与居家照护团队，重点解决转移安全、跌落风险控制与临床采购论证。",
    heroPrimary: "获取报价与产品目录",
    heroSecondary: "查看临床证据",
    heroSupportTitle: "面向经销商与机构采购的快速通道",
    heroSupportPoints: [
      "报价与批量采购咨询 24 小时内回复",
      "已准备好 Miolet III、Ardel、P300 系列目录",
      "适用于医院、养老机构、康复与居家照护",
    ],
    trustItems: ["批量采购", "经销合作", "临床评估", "品牌定制沟通"],
    productCards: [
      {
        name: "Miolet III",
        badge: "居家 / 护理床",
        description: "垂直升降设计适合小空间安装，转移更轻松，适合居家与长期护理场景。",
        cover: "/images/catalogs/miolet3-cover.png",
        pdf: "/catalogs/miolet3_catalog_201906.pdf",
        stats: ["15 cm 超低床面", "2 / 3 电机", "垂直升降"],
      },
      {
        name: "Ardel",
        badge: "护理机构床",
        description: "面向更高护理复杂度场景，结合高位背支撑与电动体位调节，覆盖更多身体状况需求。",
        cover: "/images/catalogs/ardel-cover.png",
        pdf: "/catalogs/ardel_catalog.pdf",
        stats: ["高位背支撑", "2 / 3 电机", "便于轮椅转移"],
      },
      {
        name: "P300 Series",
        badge: "医院床",
        description: "面向医院和急性期病区，重点改善抬背舒适度与剪切力控制，满足临床使用需求。",
        cover: "/images/catalogs/p300-cover.png",
        pdf: "/catalogs/P300_catalog_201901.pdf",
        stats: ["压力降低 31%", "支持 CPR", "临床配件完整"],
      },
    ],
    buyerTitle: "采购团队最先关注的问题",
    buyerItems: [
      {
        title: "能否降低患者风险？",
        description: "超低床面、减剪切力体位调节与高位背支撑，有助于降低跌落、误吸与压疮风险。",
      },
      {
        title: "护理人员是否容易操作？",
        description: "通用设计手控器、LINAK 电机与面向机构场景的配置，能明显降低培训与误操作成本。",
      },
      {
        title: "能否适配我们的使用环境？",
        description: "从狭小居家房间到急性期病房，产品线覆盖居家护理、机构护理、康复与医院部署。",
      },
      {
        title: "内部立项有没有证据支持？",
        description: "现成的临床减压数据和产品目录，能帮助运营、护理与采购团队更快完成评审。",
      },
    ],
    comparisonTitle: "更快选定合适系列",
    comparisonRows: [
      ["最适合", "居家与长期护理", "护理机构", "医院与急性期病区"],
      ["核心优势", "小空间安装与安全转移", "更复杂护理需求覆盖", "更强临床体位支持"],
      ["电机配置", "2 / 3 电机", "2 / 3 电机", "3 电机"],
      ["采购理由", "更安全的居家部署", "更广的人群适配", "病区级功能与临床证据"],
    ],
    processTitle: "从询盘到落地",
    processSteps: [
      { step: "1", title: "提交场景需求", description: "告诉我们机构类型、目标人群和预估采购量。" },
      { step: "2", title: "匹配产品资料", description: "我们发送最适合的系列目录、规格重点和选型建议。" },
      { step: "3", title: "沟通价格与配置", description: "确认床板、电机、配件和交付范围。" },
      { step: "4", title: "进入评估或下单", description: "推进经销洽谈、样机评估或正式采购。" },
    ],
    resourcesTitle: "适合采购评审的资料",
    resourcesSubtitle: "可直接用于内部汇报、经销沟通与产品对比。",
    resourceCta: "下载 PDF",
  },
} as const;

export default function LandingPage() {
  const { dict, locale } = useI18n();
  const copy = SALES_CONTENT[locale];
  const [pdfRequest, setPdfRequest] = useState<{ url: string; title: string } | null>(null);
  const heroStats = [
    { value: "15", unit: "cm", label: dict.hero.stat1Label },
    { value: "39", unit: "%", label: dict.hero.stat2Label },
    { value: "30+", unit: "", label: dict.hero.stat3Label },
    { value: "JIS", unit: "", label: locale === "en" ? "Certified line" : "认证产品线" },
  ];

  return (
    <main className="bg-stone-50">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(64,125,203,0.18),_transparent_34%),linear-gradient(135deg,#0f1b2d_0%,#142339_46%,#0b1320_100%)] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="relative mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <p className="mb-5 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
              {copy.heroEyebrow}
            </p>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {dict.hero.title}
            </h1>
            <p
              className="mt-6 max-w-2xl text-lg leading-8 text-stone-200"
              dangerouslySetInnerHTML={{ __html: dict.hero.description }}
            />
            <p className="mt-4 max-w-2xl text-base leading-7 text-stone-300">{copy.heroLead}</p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href="#contact"
                className="inline-flex items-center justify-center rounded-full bg-[#407dcb] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:bg-[#005baa]"
              >
                {copy.heroPrimary}
              </a>
              <a
                href="#cases"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/6 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/12"
              >
                {copy.heroSecondary}
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {heroStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-5 backdrop-blur">
                  <p className="text-3xl font-semibold text-white">
                    {stat.value}
                    {stat.unit ? <span className="ml-1 text-sm text-blue-200">{stat.unit}</span> : null}
                  </p>
                  <p className="mt-1 text-sm text-stone-300">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {copy.trustItems.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-stone-200"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-5 lg:pl-8">
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 shadow-2xl shadow-black/20 backdrop-blur">
              <div className="grid gap-4 sm:grid-cols-[1.15fr_0.85fr]">
                <div className="relative min-h-[320px] overflow-hidden rounded-[1.5rem] bg-white">
                  <Image
                    src="/images/catalogs/miolet3-cover.png"
                    alt="Miolet III catalog cover"
                    fill
                    className="object-cover object-top"
                    priority
                  />
                </div>
                <div className="grid gap-4">
                  <div className="relative min-h-[152px] overflow-hidden rounded-[1.25rem] bg-white">
                    <Image src="/images/catalogs/ardel-cover.png" alt="Ardel catalog cover" fill className="object-cover object-top" />
                  </div>
                  <div className="relative min-h-[152px] overflow-hidden rounded-[1.25rem] bg-white">
                    <Image src="/images/catalogs/p300-cover.png" alt="P300 catalog cover" fill className="object-cover object-top" />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-[#111111]/80 p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">{copy.heroSupportTitle}</p>
              <div className="mt-4 space-y-3">
                {copy.heroSupportPoints.map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-[#407dcb]" />
                    <p className="text-sm leading-6 text-stone-200">{point}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href="mailto:jay.lin@usproglove.us"
                  className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-stone-900 transition hover:bg-stone-100"
                >
                  jay.lin@usproglove.us
                </a>
                <a
                  href="https://calendly.com/sienovo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Calendly
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#407dcb]">{dict.features.title}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              {dict.features.subtitle}
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {dict.features.items.map((feature: { title: string; description: string }) => (
              <div key={feature.title} className="rounded-[1.75rem] border border-stone-200 bg-white p-7 shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#407dcb]">
                  <span className="text-lg font-semibold">+</span>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-stone-900">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-stone-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="products" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#407dcb]">{dict.products.title}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">{dict.products.subtitle}</h2>
            </div>
            <a
              href="#contact"
              className="inline-flex items-center justify-center rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-900 transition hover:border-stone-900"
            >
              {copy.heroPrimary}
            </a>
          </div>
          <div className="mt-10 grid gap-7 lg:grid-cols-3">
            {copy.productCards.map((product) => (
              <article key={product.name} className="overflow-hidden rounded-[2rem] border border-stone-200 bg-stone-50">
                <div className="relative aspect-[4/5] overflow-hidden bg-white">
                  <Image src={product.cover} alt={`${product.name} catalog`} fill className="object-cover object-top" />
                </div>
                <div className="p-7">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#407dcb]">
                    {product.badge}
                  </span>
                  <h3 className="mt-4 text-2xl font-semibold text-stone-900">{product.name}</h3>
                  <p className="mt-3 text-sm leading-7 text-stone-600">{product.description}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {product.stats.map((stat) => (
                      <span key={stat} className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700">
                        {stat}
                      </span>
                    ))}
                  </div>
                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setPdfRequest({ url: product.pdf, title: `${product.name} catalog` })}
                      className="inline-flex items-center justify-center rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
                    >
                      {copy.resourceCta}
                    </button>
                    <a
                      href="#contact"
                      className="inline-flex items-center justify-center rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-900 transition hover:border-stone-900"
                    >
                      {dict.cta.submit}
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="scenarios" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#407dcb]">{dict.scenarios.title}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">{copy.buyerTitle}</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {copy.buyerItems.map((item) => (
                <div key={item.title} className="rounded-[1.75rem] border border-stone-200 bg-white p-6">
                  <h3 className="text-lg font-semibold text-stone-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-stone-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {dict.scenarios.items.map((scenario: { name: string; description: string; algorithms: string[] }) => (
              <div key={scenario.name} className="rounded-[1.75rem] border border-stone-200 bg-white p-6">
                <h3 className="text-lg font-semibold text-stone-900">{scenario.name}</h3>
                <p className="mt-3 text-sm leading-7 text-stone-600">{scenario.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {scenario.algorithms.map((item: string) => (
                    <span key={item} className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cases" className="bg-[#171415] py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">{dict.cases.title}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{dict.cases.subtitle}</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {dict.cases.items.map((item: { title: string; description: string }) => (
              <div key={item.title} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-7">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
                  {item.title.match(/\d+%/)?.[0] ?? "Clinical"}
                </p>
                <h3 className="mt-3 text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-stone-300">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="specs" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#407dcb]">{dict.nav.specs}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">{copy.comparisonTitle}</h2>
              <p className="mt-4 text-base leading-8 text-stone-600">
                {locale === "en"
                  ? "Shortlist by care setting, clinical requirement, and installation constraints before you schedule a demo."
                  : "先按护理场景、临床要求和安装条件做初筛，再进入演示或评估，效率更高。"}
              </p>
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-stone-200">
              <div className="grid grid-cols-4 bg-stone-900 text-sm font-semibold text-white">
                <div className="px-5 py-4">{locale === "en" ? "Criteria" : "维度"}</div>
                <div className="px-5 py-4">Miolet III</div>
                <div className="px-5 py-4">Ardel</div>
                <div className="px-5 py-4">P300</div>
              </div>
              {copy.comparisonRows.map((row, rowIndex) => (
                <div
                  key={`${row[0]}-${rowIndex}`}
                  className={`grid grid-cols-4 text-sm ${rowIndex % 2 === 0 ? "bg-stone-50" : "bg-white"}`}
                >
                  {row.map((cell, cellIndex) => (
                    <div
                      key={`${rowIndex}-${cellIndex}`}
                      className="px-5 py-4 leading-6 text-stone-700 first:font-semibold first:text-stone-900"
                    >
                      {cell}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#407dcb]">{dict.platform.title}</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">{copy.processTitle}</h2>
              <p className="mt-4 text-base leading-8 text-stone-600">
                {locale === "en"
                  ? "A conversion page should not end at product interest. It should move buyers into a concrete next step."
                  : "高转化页面不只展示产品，还要把采购方推进到明确的下一步。"}
              </p>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {copy.processSteps.map((item) => (
                <div key={item.step} className="rounded-[1.75rem] border border-stone-200 bg-white p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-900 text-lg font-semibold text-white">
                    {item.step}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-stone-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-stone-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 rounded-[2rem] bg-[linear-gradient(135deg,#efe6de_0%,#f9f4ef_45%,#ffffff_100%)] p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#407dcb]">{copy.resourcesTitle}</p>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-stone-700">{copy.resourcesSubtitle}</p>
              </div>
              <a
                href="#products"
                className="inline-flex items-center justify-center rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
              >
                {locale === "en" ? "Browse Catalog Set" : "查看目录合集"}
              </a>
            </div>
          </div>
        </div>
      </section>
      <PdfRequestModal
        open={!!pdfRequest}
        onClose={() => setPdfRequest(null)}
        pdfUrl={pdfRequest?.url ?? ""}
        pdfTitle={pdfRequest?.title ?? ""}
      />
    </main>
  );
}
