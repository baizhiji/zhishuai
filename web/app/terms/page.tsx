import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '用户协议 - 智枢AI',
  description: '智枢AI用户服务协议',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">用户服务协议</h1>
      <p className="text-gray-500 mb-6">生效日期：2026年1月1日</p>

      <div className="prose prose-gray max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">一、服务说明</h2>
          <p>智枢AI（以下简称"本平台"）是深圳市百智集科技有限公司（以下简称"我们"）开发运营的一站式智能商业平台，提供AI内容创作、自媒体矩阵管理、智能招聘获客等服务。</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">二、账户注册与安全</h2>
          <p>您承诺：</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>提供真实、准确的注册信息</li>
            <li>妥善保管账户密码，对账户下的所有行为负责</li>
            <li>不将账户转让、出借给他人使用</li>
            <li>发现账户异常立即通知我们</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">三、服务使用规范</h2>
          <p>您不得利用本平台从事以下行为：</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>生成、传播违法或侵权内容</li>
            <li>干扰、破坏本平台正常运行</li>
            <li>利用技术手段绕过付费或使用限制</li>
            <li>进行任何形式的自动化数据采集（除官方API外）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">四、AI内容生成声明</h2>
          <p>AI生成的内容由人工智能算法产生，不构成专业建议。您应自行判断和审核AI生成内容的准确性、合法性。使用AI生成内容产生的任何后果，由您自行承担。</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">五、付费与退款</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>服务费用以购买时页面显示价格为准</li>
            <li>订阅服务到期前可随时取消，取消后不自动续费</li>
            <li>虚拟商品一经交付，不支持7天无理由退款</li>
            <li>因平台原因导致无法正常提供服务，可申请按比例退款</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">六、知识产权</h2>
          <p>本平台的软件、UI设计、商标等知识产权归我们所有。您使用AI生成的内容，其著作权归属根据具体功能的使用条款确定。</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">七、免责声明</h2>
          <p>本平台按"现状"提供服务，不对服务的持续性、准确性、可靠性做出额外保证。因不可抗力、系统维护、网络故障等原因造成的服务中断，我们不承担责任。</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">八、协议变更</h2>
          <p>我们有权根据需要修改本协议。修改后的协议一经发布即生效。重大变更将通过通知告知。继续使用服务即表示接受修改后的协议。</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">九、联系我们</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>公司：深圳市百智集科技有限公司</li>
            <li>邮箱：support@zhishuai.com</li>
            <li>地址：中国广东省深圳市</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
