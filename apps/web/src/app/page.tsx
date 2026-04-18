import PiLoginButton from '@/components/PiLoginButton';
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1E112A] via-[#2A1642] to-[#110B19] text-gray-100 font-sans selection:bg-[#F3C136] selection:text-[#1E112A] flex flex-col">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-[#1E112A]/80 backdrop-blur-lg border-b border-white/5 shadow-lg">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-4 py-4 md:px-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#F3C136] to-[#EEA834] flex items-center justify-center p-[1px] shadow-lg shadow-[#F3C136]/20">
              <div className="flex items-center justify-center w-full h-full bg-[#1E112A] rounded-[11px]">
                <span className="text-xl font-black text-[#F3C136]">AI</span>
              </div>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">Pioneer AI Framework</h1>
              <p className="text-xs text-[#F3C136]/80 font-medium">商业闭环与赋能基建</p>
            </div>
          </div>
          <PiLoginButton />
        </div>
      </header>

      {/* Hero 首屏区 */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24 md:px-6 text-center md:text-left flex flex-col md:flex-row items-center">
        <div className="md:w-3/5 space-y-6">
          <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-[#F3C136] tracking-widest uppercase mb-2 shadow-inner">
            Next Generation DApp Foundation
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 leading-tight tracking-tight">
            赋能千万先锋的 <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F3C136] to-[#EEA834]">智能服务协同引擎</span>
          </h2>
          <p className="text-gray-400 text-sm md:text-lg max-w-xl mx-auto md:mx-0 leading-relaxed font-medium">
            为全行业开发者与商户提供生态 API 互通、AI 业务辅助以及灵活的模块化管理系统，助力生态建设者高效部署商业闭环。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
            <Link 
              href="/dashboard"
              className="w-full sm:w-auto text-center font-bold text-[#1E112A] bg-[#F3C136] hover:bg-[#EEA834] px-8 py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(243,193,54,0.3)] hover:shadow-[0_0_25px_rgba(243,193,54,0.5)] transform hover:-translate-y-0.5"
            >
              🔥 启动我的控制台
            </Link>
            <a 
              href="#pricing"
              className="w-full sm:w-auto text-center font-bold text-white bg-white/5 border border-white/20 hover:bg-white/10 px-8 py-3.5 rounded-xl transition-all"
            >
              💡 浏览智能业务计划
            </a>
          </div>
        </div>
        
        <div className="hidden md:flex md:w-2/5 justify-center mt-12 md:mt-0 relative">
           <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#7C3AED] rounded-full blur-[100px] opacity-30"></div>
           <div className="w-full max-w-sm aspect-square border border-white/10 bg-[#2A1642]/60 backdrop-blur-xl rounded-3xl p-6 shadow-2xl relative z-10 flex flex-col relative overflow-hidden">
             <div className="flex space-x-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
             </div>
             <div className="space-y-4 flex-1">
               <div className="h-4 bg-white/10 rounded w-3/4"></div>
               <div className="h-4 bg-white/5 rounded w-1/2"></div>
               <div className="h-12 bg-[#F3C136]/20 border border-[#F3C136]/30 rounded-xl mt-6 flex flex-col justify-center px-4">
                  <div className="h-2 bg-[#F3C136] rounded w-1/3"></div>
               </div>
               <div className="h-12 bg-white/5 rounded-xl mt-2"></div>
             </div>
           </div>
        </div>
      </section>

      {/* 信任背书区 */}
      <section className="border-y border-white/5 bg-white/5 py-6 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-wrap justify-center gap-4 text-xs md:text-sm font-bold text-gray-300">
          <div className="flex items-center px-4 py-2 bg-[#1E112A] rounded-full border border-white/10">
            <span className="text-[#F3C136] mr-2 text-lg leading-none">✓</span> 全面集成原生验证架构
          </div>
          <div className="flex items-center px-4 py-2 bg-[#1E112A] rounded-full border border-white/10">
            <span className="text-[#F3C136] mr-2 text-lg leading-none">✓</span> 依托生态分布信任网络
          </div>
          <div className="flex items-center px-4 py-2 bg-[#1E112A] rounded-full border border-white/10">
            <span className="text-[#F3C136] mr-2 text-lg leading-none">✓</span> 无缝的平台身份衔接体验
          </div>
        </div>
      </section>

      {/* 核心订阅定价区 */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 py-20 md:px-6 pt-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">商业赋能引擎与业务方案</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">以框架赋能重塑产品生态潜力。选择最适合您团队进阶的服务包配置。</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Plan 1 */}
          <div className="bg-[#1E112A]/60 border border-white/10 rounded-3xl p-8 flex flex-col hover:border-white/20 transition-all">
            <h3 className="text-xl font-bold text-gray-200 mb-2">基础业务前瞻版</h3>
            <p className="text-gray-400 text-sm mb-6 h-10">使用本标准组件框架快速跑通业务模型。</p>
            <div className="text-4xl font-black text-[#F3C136] mb-8 border-b border-white/10 pb-6">
              π 5.00 <span className="text-sm text-gray-500 font-medium">/起</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1 text-sm text-gray-300">
              <li className="flex items-start"><span className="text-green-400 mr-2">✓</span> 获取展示体系 UI 模版池</li>
              <li className="flex items-start"><span className="text-green-400 mr-2">✓</span> 标准业务对账后台一览</li>
              <li className="flex items-start"><span className="text-green-400 mr-2">✓</span> 每月 3 次组件配置技术辅导</li>
            </ul>
            <Link href="/checkout?plan=basic" className="w-full block text-center py-3 rounded-xl font-bold text-gray-300 bg-white/10 hover:bg-white/20 transition-colors">
              配置前瞻版
            </Link>
          </div>

          {/* Plan 2 PRO (Highlighted) */}
          <div className="bg-[#2A1642] border-2 border-[#F3C136]/50 rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-[#F3C136]/10">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#F3C136] text-[#1E112A] text-xs font-black uppercase tracking-widest py-1 px-4 rounded-full">
              开发者青睐方案
            </div>
            <h3 className="text-xl font-bold text-white mb-2">专业 AI 架构增益</h3>
            <p className="text-gray-300 text-sm mb-6 h-10">获取架构师答疑体系，系统性加持运营链路。</p>
            <div className="text-5xl font-black text-[#F3C136] mb-8 border-b border-white/10 pb-6">
              π 25.00 <span className="text-sm text-gray-400 font-medium">/期</span>
            </div>
            <ul className="space-y-4 mb-8 flex-1 text-sm text-gray-200">
              <li className="flex items-start"><span className="text-[#F3C136] mr-2">✓</span> <strong className="text-white font-bold ml-1">架构支持：</strong>资深应用向导答疑时间</li>
              <li className="flex items-start"><span className="text-[#F3C136] mr-2">✓</span> <strong className="text-white font-bold ml-1">AI 增益：</strong>获取商用的自动化运营挂件库</li>
              <li className="flex items-start"><span className="text-[#F3C136] mr-2">✓</span> 涵盖前瞻版全部底层呈现力</li>
              <li className="flex items-start"><span className="text-[#F3C136] mr-2">✓</span> 探索畅通的生态资源结对支持</li>
            </ul>
            <Link href="/checkout?plan=pro" className="w-full block text-center py-3.5 rounded-xl font-black text-[#1E112A] bg-[#F3C136] hover:bg-[#EEA834] transition-colors shadow-lg">
              开启智能专业架构
            </Link>
          </div>

          {/* Plan 3 */}
          <div className="bg-[#1E112A]/60 border border-white/10 rounded-3xl p-8 flex flex-col hover:border-white/20 transition-all">
            <h3 className="text-xl font-bold text-gray-200 mb-2">生态共创定制</h3>
            <p className="text-gray-400 text-sm mb-6 h-10">为资源充沛的机构节点提供集成研讨。</p>
            <div className="text-4xl font-black text-gray-100 mb-8 border-b border-white/10 pb-6">
              需求提案
            </div>
            <ul className="space-y-4 mb-8 flex-1 text-sm text-gray-300">
              <li className="flex items-start"><span className="text-green-400 mr-2">✓</span> 特定赛道的应用代码级定制</li>
              <li className="flex items-start"><span className="text-green-400 mr-2">✓</span> 生态应用指北与最佳实践宣讲</li>
              <li className="flex items-start"><span className="text-green-400 mr-2">✓</span> 高可用的项目解耦与云协同</li>
            </ul>
            <button className="w-full text-center py-3 rounded-xl font-bold text-gray-300 bg-white/10 hover:bg-white/20 transition-colors">
              与顾问研讨
            </button>
          </div>
        </div>
      </section>

      {/* 行业 Demo 场景区 */}
      <section className="bg-[#110B19] py-20 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-white mb-3">多垂直行业结构兼容性</h2>
            <p className="text-gray-400 text-sm">一套底层设施即可支撑多样化的业务叙事实践</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Demo 1: Education */}
            <div className="bg-[#1E112A]/80 border border-white/5 rounded-2xl p-6 group hover:bg-[#2A1642] transition-colors">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 text-2xl mb-4">📚</div>
              <h4 className="text-lg font-bold text-gray-200 mb-2 group-hover:text-white">数字知识载库 (EdTech)</h4>
              <p className="text-gray-500 text-sm leading-relaxed">提供专为导师定制的数字化专栏资源查阅权及独立课程展示组件模块。</p>
            </div>
            
            {/* Demo 2: Beauty Local (Legacy downgraded) */}
            <div className="bg-[#1E112A]/80 border border-white/5 rounded-2xl p-6 group hover:bg-[#2A1642] transition-colors relative">
               <div className="absolute top-4 right-4 text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-400">本地服务示例</div>
              <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center text-pink-400 text-2xl mb-4">🛠️</div>
              <h4 className="text-lg font-bold text-gray-200 mb-2 group-hover:text-white">下沉同城业务矩阵</h4>
              <p className="text-gray-500 text-sm leading-relaxed">有效化解实体店的档期分配冲突，探索“线上锁定配额，随后到店核销体验”的融合模式。</p>
              <Link href="/services/demo-beauty" className="inline-block mt-4 text-[#F3C136] text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">加载实景流 →</Link>
            </div>

            {/* Demo 3: B2B Legal */}
            <div className="bg-[#1E112A]/80 border border-white/5 rounded-2xl p-6 group hover:bg-[#2A1642] transition-colors">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 text-2xl mb-4">⚖️</div>
              <h4 className="text-lg font-bold text-gray-200 mb-2 group-hover:text-white">严肃企业咨询 (B2B)</h4>
              <p className="text-gray-500 text-sm leading-relaxed">在确保隔离的通道中下发顾问档案流验证，协助高级别商业会议排期的前置敲定。</p>
            </div>
          </div>
        </div>
      </section>

      {/* 底部引导栏与 Footer */}
      <footer className="mt-auto border-t border-white/5 bg-[#0B0610]">
        <div className="bg-gradient-to-r from-[#2A1642] to-[#1E112A] border-b border-white/5">
          <div className="max-w-6xl mx-auto px-4 py-8 md:px-6 flex flex-col md:flex-row items-center justify-between">
            <div className="mb-4 md:mb-0 text-center md:text-left">
              <h3 className="text-lg font-bold text-white mb-1">立即着手构建属于您的专属生态展示面</h3>
              <p className="text-gray-400 text-sm">搭载智能组件与基建架构空间，为前沿拓荒注入动能。</p>
            </div>
            <Link href="/dashboard" className="px-6 py-2.5 bg-white text-[#110B19] rounded-xl font-bold hover:bg-gray-200 transition-colors">
              获取平台接入权
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8 md:px-6 flex flex-col md:flex-row justify-between items-center text-gray-500 text-xs md:text-sm">
          <p className="mb-4 md:mb-0">
            © 2026 Pioneer AI Service Framework. 探索前沿效率.
          </p>
          <div className="flex items-center space-x-6">
            <span className="hover:text-[#F3C136] transition-colors cursor-pointer">控制台</span>
            <span className="hover:text-[#F3C136] transition-colors cursor-pointer">框架指北</span>
            <span className="hover:text-[#F3C136] transition-colors cursor-pointer">责任声告</span>
          </div>
        </div>
        <div className="text-center py-4 text-[10px] text-gray-600 bg-black/30">
          Disclaimer: This application is not officially affiliated with the Pi Core Team. It is an independent utility software created by the community. Nothing herein constitutes financial or trading advice.
        </div>
      </footer>
    </main>
  );
}
