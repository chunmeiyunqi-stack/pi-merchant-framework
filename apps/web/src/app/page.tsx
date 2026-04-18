import PiLoginButton from '@/components/PiLoginButton';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0A0510] text-gray-100 font-sans selection:bg-[#F3C136] selection:text-[#1E112A] flex flex-col overflow-x-hidden">
      {/* Background Ambience / 背景微光氛围 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[40%] md:w-[40%] bg-[#7C3AED]/20 blur-[120px] md:blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[40%] md:w-[40%] bg-[#F3C136]/10 blur-[120px] md:blur-[150px] rounded-full"></div>
      </div>

      {/* Header / 顶导大基框 */}
      <header className="sticky top-0 z-50 bg-[#0A0510]/80 backdrop-blur-xl border-b border-white/5">
        <div className="w-full max-w-[1440px] mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-12 h-16 md:h-20">
          <div className="flex items-center space-x-2 md:space-x-4 shrink-0">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-gradient-to-tr from-[#F3C136] to-[#EEA834] flex items-center justify-center p-[1px] shadow-lg shadow-[#F3C136]/10 shrink-0">
              <div className="flex items-center justify-center w-full h-full bg-[#150B20] rounded-[7px] md:rounded-[11px]">
                <span className="text-sm md:text-xl font-black text-[#F3C136]">AI</span>
              </div>
            </div>
            <div className="flex flex-col justify-center truncate">
              <h1 className="text-base md:text-xl font-bold text-white tracking-tight leading-none truncate pr-2">Pioneer AI</h1>
              <p className="text-[9px] md:text-[11px] text-[#F3C136]/80 font-medium mt-1 uppercase tracking-widest hidden sm:block">Commercial Ecosystem</p>
            </div>
          </div>
          <div className="flex items-center shrink-0">
            <PiLoginButton />
          </div>
        </div>
      </header>

      {/* Hero / 双栏巨幕首屏区 */}
      <section className="relative z-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-12 pb-20 md:pt-20 md:pb-32 lg:pt-32 lg:pb-40 flex flex-col lg:flex-row items-center gap-10 lg:gap-24">
        {/* Hero Left Copy */ }
        <div className="w-full lg:w-[55%] flex flex-col space-y-6 md:space-y-8 text-center lg:text-left mt-4 md:mt-0">
          <div className="inline-flex items-center self-center lg:self-start px-3 py-1.5 bg-[#FFFFFF]/5 border border-white/10 rounded-full text-[10px] md:text-xs font-bold text-[#F3C136] tracking-widest uppercase shadow-sm">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#F3C136] mr-2 animate-pulse"></span>
            Next Generation DApp Foundation
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-7xl xl:text-[80px] font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-500 leading-[1.1] md:leading-[1.05] tracking-tight md:tracking-tighter px-2 lg:px-0">
            赋能千万先锋的 <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F3C136] to-[#D18E15]">智能服务引擎</span>
          </h2>
          <p className="text-gray-400 text-base md:text-lg lg:text-xl max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
            为全行业开发者与商户提供原生生态 API 互通、AI 业务辅助及模块化调度系统。顷刻实现链上资产流转的高效商业闭环。
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 md:gap-4 pt-2 md:pt-4 w-full sm:w-auto">
            <Link 
              href="/dashboard"
              className="group flex items-center justify-center font-bold text-[#1E112A] bg-[#F3C136] hover:bg-[#EEA834] px-6 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl transition-all shadow-lg hover:shadow-[#F3C136]/30 text-base md:text-lg w-full sm:w-auto"
            >
              启动控制台
              <svg className="w-4 h-4 md:w-5 md:h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
            <a 
              href="#pricing"
              className="flex items-center justify-center font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 px-6 md:px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl transition-all text-base md:text-lg w-full sm:w-auto"
            >
              浏览智能计划
            </a>
          </div>
          <div className="flex justify-center lg:justify-start flex-wrap items-center gap-x-4 md:gap-x-8 gap-y-2 md:gap-y-4 pt-6 md:pt-8 text-xs md:text-sm font-semibold text-gray-500 border-t border-white/5 mt-6 md:mt-8">
            <div className="flex items-center"><span className="text-[#8B5CF6] mr-1.5 md:mr-2 text-lg md:text-xl leading-none">✓</span> 原生验证架构</div>
            <div className="flex items-center"><span className="text-[#8B5CF6] mr-1.5 md:mr-2 text-lg md:text-xl leading-none">✓</span> 分布信任网络</div>
            <div className="flex items-center"><span className="text-[#8B5CF6] mr-1.5 md:mr-2 text-lg md:text-xl leading-none">✓</span> 无缝身份衔接</div>
          </div>
        </div>
        
        {/* Hero Right Graphic / 右侧大屏应用态示意 */}
        <div className="w-full max-w-sm lg:max-w-none mx-auto lg:w-[45%] relative mt-8 lg:mt-0 px-2 sm:px-0">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#7C3AED]/20 to-[#F3C136]/10 blur-2xl md:blur-3xl -z-10 rounded-full"></div>
          <div className="w-full aspect-[4/3] bg-[#150B20]/80 backdrop-blur-3xl border border-white/10 rounded-2xl md:rounded-[2rem] p-4 md:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between group">
             {/* Mockup Topbar */}
             <div className="flex justify-between items-center bg-white/5 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5">
                <div className="flex gap-1.5 md:gap-2">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="w-20 md:w-24 h-3 md:h-4 rounded px-2 text-[8px] md:text-[10px] bg-white/10 text-center font-mono opacity-50 flex items-center justify-center">sdk.minepi.com</div>
             </div>
             
             {/* Mockup Content */}
             <div className="flex-1 mt-4 md:mt-6 flex flex-col gap-3 md:gap-4">
                <div className="w-3/4 h-6 md:h-8 bg-gradient-to-r from-gray-700 to-gray-800 rounded-md md:rounded-lg"></div>
                <div className="w-1/2 h-3 md:h-4 bg-gray-800 rounded"></div>
                <div className="grid grid-cols-2 gap-3 md:gap-4 mt-auto">
                   <div className="h-20 md:h-24 rounded-lg md:rounded-xl bg-white/5 border border-white/10 p-3 md:p-4 flex flex-col justify-between group-hover:bg-white/10 transition-colors">
                     <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-indigo-500/20"></div>
                     <div className="w-full h-1.5 md:h-2 bg-gray-700 rounded-[1px] md:rounded-sm"></div>
                   </div>
                   <div className="h-20 md:h-24 rounded-lg md:rounded-xl bg-white/5 border border-[#F3C136]/20 p-3 md:p-4 flex flex-col justify-between bg-gradient-to-br from-[#F3C136]/5 to-transparent">
                     <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-[#F3C136]/20"></div>
                     <div className="w-full h-1.5 md:h-2 bg-[#F3C136]/50 rounded-[1px] md:rounded-sm"></div>
                   </div>
                </div>
             </div>
             
             {/* Overlay elements mapping SDK logic */}
             <div className="absolute right-[-10px] md:right-[-20px] bottom-10 md:bottom-16 bg-[#1A1A1A] border border-gray-700 text-[10px] md:text-xs px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl shadow-2xl flex items-center font-mono text-gray-400">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-400 rounded-full mr-2"></span> Connection Alive 
             </div>
          </div>
        </div>
      </section>

      {/* Pricing / Capabilities */}
      <section id="pricing" className="relative z-10 w-full bg-[#0E0715] py-20 md:py-32 border-y border-white/5">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-20 lg:mb-28 px-2">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-4 md:mb-6 tracking-tight leading-tight">核心商业部署方案</h2>
            <p className="text-gray-400 text-base md:text-xl font-medium">以标准化组件重塑生态应用的生产力，精准匹配业务进程。</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-stretch">
            {/* Basic Plan */}
            <div className="bg-[#150B20] border border-white/10 rounded-2xl md:rounded-[2rem] p-6 md:p-10 flex flex-col hover:bg-[#1A0E2A] hover:border-white/20 transition-all lg:mt-8 lg:mb-8">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">基础先锋</h3>
              <p className="text-gray-400 text-sm mb-6 md:mb-8 h-auto md:h-10">极速跑通底层支付账本与标准业务流。</p>
              <div className="text-4xl md:text-5xl font-black text-[#F3C136] mb-6 md:mb-8 pb-6 md:pb-8 border-b border-white/10 tracking-tight">
                π 5 <span className="text-sm md:text-base text-gray-500 font-medium tracking-normal">/ 期</span>
              </div>
              <ul className="space-y-4 md:space-y-5 mb-8 md:mb-10 flex-1 text-sm text-gray-300 font-medium">
                <li className="flex items-start"><span className="text-[#8B5CF6] mr-3 font-bold">✓</span> 标准化组件授权池</li>
                <li className="flex items-start"><span className="text-[#8B5CF6] mr-3 font-bold">✓</span> 基础数据大盘洞察</li>
                <li className="flex items-start"><span className="text-[#8B5CF6] mr-3 font-bold">✓</span> 社区异步技术辅导</li>
              </ul>
              <Link href="/checkout?plan=basic" className="w-full inline-flex justify-center items-center py-3.5 md:py-4 rounded-xl font-bold text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                配置前瞻框架
              </Link>
            </div>

            {/* Pro Plan (Hero Card) */}
            <div className="relative bg-gradient-to-b from-[#2A1642] to-[#1E112E] border border-[#F3C136]/30 rounded-2xl md:rounded-[2rem] p-6 md:p-10 flex flex-col shadow-2xl shadow-[#F3C136]/5 transform lg:-translate-y-4 mt-2 mb-2 lg:my-0">
              <div className="absolute top-0 inset-x-0 h-1 md:h-1.5 bg-gradient-to-r from-[#F3C136] to-[#EEA834] rounded-t-2xl md:rounded-t-[2rem]"></div>
              <div className="absolute top-[-12px] md:top-[-14px] left-1/2 transform -translate-x-1/2 bg-[#F3C136] text-[#1E112A] text-[9px] md:text-[10px] font-black uppercase tracking-widest py-1 md:py-1.5 px-3 md:px-4 rounded-full shadow-lg whitespace-nowrap">
                专业应用精选
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">专业架构</h3>
              <p className="text-gray-300 text-sm mb-6 md:mb-8 h-auto md:h-10">全量的高级 AI 组件接入和专属核心架构护航。</p>
              <div className="text-5xl md:text-6xl font-black text-[#F3C136] mb-6 md:mb-8 pb-6 md:pb-8 border-b border-white/10 tracking-tight flex items-end">
                π 25 <span className="text-sm md:text-base text-gray-400 font-medium tracking-normal pb-1.5 md:pb-2 ml-2">/ 期</span>
              </div>
              <ul className="space-y-4 md:space-y-5 mb-8 md:mb-10 flex-1 text-sm text-gray-200 font-medium">
                <li className="flex items-start"><span className="text-[#F3C136] mr-3 font-bold">✓</span> <strong className="text-white">深度护航：</strong>专有架构师资源辅导</li>
                <li className="flex items-start"><span className="text-[#F3C136] mr-3 font-bold">✓</span> <strong className="text-white">AI赋能：</strong>自动化商用调度节点</li>
                <li className="flex items-start"><span className="text-[#F3C136] mr-3 font-bold">✓</span> 包含所有前瞻版底层构件</li>
                <li className="flex items-start"><span className="text-[#F3C136] mr-3 font-bold">✓</span> 专线解决开发链路卡点</li>
              </ul>
              <Link href="/checkout?plan=pro" className="w-full inline-flex justify-center items-center py-3.5 md:py-4 rounded-xl font-bold text-[#1E112A] bg-[#F3C136] hover:bg-[#EEA834] transition-colors shadow-lg shadow-[#F3C136]/20">
                激活智能专业引擎
              </Link>
            </div>

            {/* Custom Plan */}
            <div className="bg-[#150B20] border border-white/10 rounded-2xl md:rounded-[2rem] p-6 md:p-10 flex flex-col hover:bg-[#1A0E2A] hover:border-white/20 transition-all lg:mt-8 lg:mb-8">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">生态共创定制</h3>
              <p className="text-gray-400 text-sm mb-6 md:mb-8 h-auto md:h-10">大型资产及机构节点的本地化深度逻辑整合。</p>
              <div className="text-3xl md:text-4xl font-black text-gray-100 mb-6 md:mb-8 pb-6 md:pb-8 border-b border-white/10 tracking-tight flex items-center md:h-[76px]">
                定向提案
              </div>
              <ul className="space-y-4 md:space-y-5 mb-8 md:mb-10 flex-1 text-sm text-gray-300 font-medium">
                <li className="flex items-start"><span className="text-[#8B5CF6] mr-3 font-bold">✓</span> <strong className="text-gray-200">垂类定制：</strong>独占业务逻辑注入</li>
                <li className="flex items-start"><span className="text-[#8B5CF6] mr-3 font-bold">✓</span> 本地部署与风控安全布道</li>
                <li className="flex items-start"><span className="text-[#8B5CF6] mr-3 font-bold">✓</span> 异构应用上链安全顾问</li>
              </ul>
              <button className="w-full inline-flex justify-center items-center py-3.5 md:py-4 rounded-xl font-bold text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                与专家组排期
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Demos Section */}
      <section className="relative z-10 w-full py-20 md:py-32 bg-[#0A0510]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
          <div className="mb-12 md:mb-20 flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 px-2 md:px-0">
            <div className="max-w-2xl text-center md:text-left">
               <h2 className="text-3xl md:text-5xl font-black text-white mb-4 md:mb-6 tracking-tight leading-tight">多域商业垂直兼容</h2>
               <p className="text-gray-400 text-base md:text-xl font-medium">极其统一的底层支付引擎，平滑支撑分化的真实场景叙事。</p>
            </div>
            <Link href="/dashboard" className="text-[#F3C136] font-bold md:hover:underline flex items-center justify-center md:justify-end shrink-0 bg-white/5 md:bg-transparent py-3 md:py-0 rounded-xl md:rounded-none">
               探究应用示例 <span className="text-lg md:text-xl ml-1 md:ml-2 font-black leading-none">→</span>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
            {/* Demo 1 */}
            <div className="group bg-[#150B20] border border-white/5 rounded-2xl md:rounded-[2rem] p-6 md:p-10 md:hover:bg-[#1A0E2A] md:hover:border-white/10 transition-all cursor-pointer">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-500/10 rounded-xl md:rounded-2xl flex items-center justify-center text-indigo-400 mb-6 md:mb-8 border border-indigo-500/20 shadow-inner">
                <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <h4 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">数字知识平台</h4>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed">提供专为导师定制的数字化专栏资源查阅权及独立打卡组件模块。</p>
            </div>
            
            {/* Demo 2 */}
            <div className="group bg-[#150B20] border border-white/5 rounded-2xl md:rounded-[2rem] p-6 md:p-10 md:hover:bg-[#1A0E2A] md:hover:border-white/10 transition-all cursor-pointer relative overflow-hidden">
               <div className="absolute top-6 right-6 md:top-8 md:right-8 px-2.5 py-1 md:px-3 md:py-1.5 bg-white/5 rounded-full text-[9px] md:text-[10px] font-bold tracking-widest uppercase text-gray-500 flex items-center">
                 <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-[#F3C136] rounded-full mr-1.5 auto-pulse"></div>主推
               </div>
              <div className="w-12 h-12 md:w-16 md:h-16 bg-pink-500/10 rounded-xl md:rounded-2xl flex items-center justify-center text-pink-400 mb-6 md:mb-8 border border-pink-500/20 shadow-inner">
                <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <h4 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">实体业务破圈</h4>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed">重塑同城业务实体的“线上 Pi 锁定配额，线下核销享受”融合模式。</p>
            </div>

            {/* Demo 3 */}
            <div className="group bg-[#150B20] border border-white/5 rounded-2xl md:rounded-[2rem] p-6 md:p-10 md:hover:bg-[#1A0E2A] md:hover:border-white/10 transition-all cursor-pointer">
              <div className="w-12 h-12 md:w-16 h-16 bg-emerald-500/10 rounded-xl md:rounded-2xl flex items-center justify-center text-emerald-400 mb-6 md:mb-8 border border-emerald-500/20 shadow-inner">
                 <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
              </div>
              <h4 className="text-xl md:text-2xl font-bold text-white mb-3 md:mb-4">企业级合规</h4>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed">通过硬性鉴权流下发高维通行凭证，支撑 B 端会晤与跨域对公交易。</p>
            </div>
          </div>
        </div>
      </section>

      {/* Post-CTA Section */}
      <section className="relative z-10 w-full py-16 md:py-24 bg-gradient-to-br from-[#2A1642] to-[#150B20] border-y border-white/5 overflow-hidden">
        <div className="absolute right-0 bottom-0 w-[80%] md:w-[50%] h-[120%] md:h-[150%] bg-[#F3C136]/10 blur-[100px] md:blur-[150px] pointer-events-none"></div>
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 flex flex-col md:flex-row justify-between items-center z-10 relative">
          <div className="max-w-xl text-center md:text-left mb-8 md:mb-0">
             <h2 className="text-3xl lg:text-5xl font-black text-white leading-[1.1] md:leading-[1.1] mb-4 md:mb-6">着眼未来生态 <br className="hidden md:block" /> 即场构制蓝图</h2>
             <p className="text-base md:text-lg text-gray-300 font-medium">跳过极其繁杂的基础重构，即刻启航真正具备壁垒的应用进程。</p>
          </div>
          <div className="flex shrink-0 w-full md:w-auto">
            <Link 
              href="/dashboard"
              className="w-full md:w-auto bg-white text-[#110B19] md:hover:bg-gray-100 font-bold px-8 py-4 md:px-10 md:py-5 rounded-xl md:rounded-2xl transition-all shadow-2xl text-base md:text-lg flex items-center justify-center group"
            >
              部署生态站台
              <span className="text-xl md:text-2xl ml-2 md:ml-3 font-black leading-none group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="w-full bg-[#05020A] pt-16 md:pt-24 border-t border-white/5">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row justify-between pb-16 md:pb-24">
           {/* Footer Brand */}
           <div className="max-w-xs mb-12 lg:mb-0 text-center lg:text-left mx-auto lg:mx-0">
             <div className="flex items-center justify-center lg:justify-start space-x-3 mb-5 md:mb-6">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-tr from-[#F3C136] to-[#EEA834] flex items-center justify-center p-[1px]">
                  <div className="flex items-center justify-center w-full h-full bg-[#05020A] rounded-[6px] md:rounded-[7px]">
                    <span className="text-[10px] md:text-sm font-black text-[#F3C136]">AI</span>
                  </div>
                </div>
                <h3 className="text-base md:text-lg font-bold text-white tracking-tight">Pioneer Framework</h3>
             </div>
             <p className="text-xs md:text-sm text-gray-500 leading-relaxed font-medium">为生态系统内应用提供极度安全、精练、并彻底闭环的全栈接入基架。</p>
           </div>
           
           {/* Footer Links (Grid) */}
           <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 lg:gap-24 w-full lg:w-auto text-center lg:text-left">
             <div className="col-span-1">
               <h4 className="text-white font-bold mb-4 md:mb-6 text-sm">生态资源</h4>
               <ul className="space-y-3 md:space-y-4 text-xs md:text-sm text-gray-500 font-medium">
                 <li><Link href="/" className="md:hover:text-white transition-colors">组件文档集</Link></li>
                 <li><Link href="/" className="md:hover:text-white transition-colors">安全接入网</Link></li>
                 <li><Link href="/" className="md:hover:text-white transition-colors">架构演示间</Link></li>
               </ul>
             </div>
             <div className="col-span-1">
               <h4 className="text-white font-bold mb-4 md:mb-6 text-sm">解决方案</h4>
               <ul className="space-y-3 md:space-y-4 text-xs md:text-sm text-gray-500 font-medium">
                 <li><Link href="#pricing" className="md:hover:text-white transition-colors">前沿基础服</Link></li>
                 <li><Link href="#pricing" className="md:hover:text-white transition-colors">体系构建组</Link></li>
                 <li><Link href="#pricing" className="md:hover:text-white transition-colors">大型节点端</Link></li>
               </ul>
             </div>
             <div className="col-span-2 lg:col-span-1 pt-4 lg:pt-0 border-t border-white/5 lg:border-t-0">
               <h4 className="text-white font-bold mb-4 md:mb-6 text-sm">平台法则</h4>
               <ul className="flex justify-center lg:flex-col lg:space-y-4 lg:space-x-0 space-x-6 text-xs md:text-sm text-gray-500 font-medium list-none">
                 <li><Link href="/" className="md:hover:text-white transition-colors">合规明细</Link></li>
                 <li><Link href="/" className="md:hover:text-white transition-colors">隐私保护</Link></li>
                 <li><Link href="/" className="md:hover:text-white transition-colors">用户条规</Link></li>
               </ul>
             </div>
           </div>
        </div>
        
        {/* Deep Disclaimer */}
        <div className="border-t border-white/5 py-8 md:py-10 bg-[#030105]">
           <div className="max-w-[1440px] mx-auto px-4 lg:px-12 flex flex-col items-center text-center">
              <p className="text-[9px] sm:text-[10px] md:text-[11px] text-gray-600/70 max-w-5xl tracking-normal md:tracking-wide uppercase leading-loose md:leading-[1.8] font-medium mb-4 md:mb-6 md:mix-blend-screen px-2">
                 Disclaimer: This framework is independently authored by community developers and is not an official product of the Pi Core Team. References to ecosystem compatibility do not constitute affiliation. Operation of apps relies on third-party integrations. Nothing herein constitutes financial or trading advice.
              </p>
              <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 text-xs md:text-sm text-gray-600 font-bold tracking-tight">
                 <span>© 2026 Pioneer AI Service Framework.</span>
                 <span className="hidden sm:inline">探索前沿效率.</span>
              </div>
           </div>
        </div>
      </footer>
    </main>
  );
}
