import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '隐私政策 - 智枢AI',
  description: '智枢AI隐私政策，了解我们如何收集、使用和保护您的个人信息',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">隐私政策</h1>
      <p className="text-gray-500 mb-6">生效日期：2026年1月1日 | 最后更新：2026年6月15日</p>

      <div className="prose prose-gray max-w-none space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">一、信息收集</h2>
          <p>我们收集以下类型的信息：</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>账户信息</strong>：手机号、姓名、邮箱地址，用于账户创建和身份验证</li>
            <li><strong>使用数据</strong>：功能使用频率、操作日志、AI服务调用记录</li>
            <li><strong>设备信息</strong>：设备型号、操作系统版本、网络类型，用于优化服务体验</li>
            <li><strong>内容数据</strong>：您上传的素材、生成的AI内容、发布记录</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">二、信息使用</h2>
          <p>我们使用收集的信息用于：</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>提供、维护和改进我们的AI创作与营销服务</li>
            <li>处理您的订阅和支付</li>
            <li>发送服务通知和功能更新</li>
            <li>检测和防止欺诈、滥用行为</li>
            <li>遵守法律法规要求</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">三、信息共享</h2>
          <p>我们不会出售您的个人信息。仅在以下情况下共享：</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>获得您的明确授权</li>
            <li>为完成服务所必需（如支付处理、短信发送）</li>
            <li>法律要求或政府机关合法请求</li>
            <li>保护智枢AI、用户或公众的权利、财产或安全</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">四、数据存储与安全</h2>
          <p>您的数据存储在位于中国大陆的安全服务器上。我们采用行业标准的加密技术和访问控制措施保护您的数据安全。数据保留期限为您账户有效期内及法律要求的必要期限。</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">五、您的权利</h2>
          <p>您有权：</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>访问和导出您的个人数据</li>
            <li>更正不准确的个人信息</li>
            <li>删除您的账户和相关数据</li>
            <li>撤回同意（不影响撤回前已进行的处理）</li>
            <li>就数据处理问题向我们投诉</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">六、Cookie和跟踪技术</h2>
          <p>我们使用必要的Cookie维持会话状态。您可以通过浏览器设置管理Cookie偏好。我们使用的分析工具仅收集匿名的使用统计数据。</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">七、儿童隐私</h2>
          <p>我们的服务不面向14周岁以下的儿童。如果我们发现无意中收集了儿童的个人信息，将立即删除。</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">八、政策更新</h2>
          <p>我们可能会更新本隐私政策。重大变更将通过应用内通知或邮件告知。继续使用我们的服务即表示您同意更新后的政策。</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">九、联系我们</h2>
          <p>如有隐私相关问题，请通过以下方式联系我们：</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>邮箱：privacy@zhishuai.com</li>
            <li>地址：中国广东省深圳市</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
