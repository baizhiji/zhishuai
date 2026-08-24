import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

// 服务条款（与电脑端一致）
const TERMS_SECTIONS = [
  {
    title: '一、条款的接受',
    content:
      '欢迎使用智枢AI平台（https://baizhiji.net，包括 Web 端、移动端 App 及小程序等全部客户端形态，以下简称"本平台"或"我们"）。本服务条款（以下简称"本条款"）是您与本平台运营方之间就使用本平台服务所订立的协议。当您注册、登录或使用本平台服务时，即视为您已阅读、理解并同意接受本条款的全部内容。若您不同意本条款，请停止注册或使用本平台服务。',
  },
  {
    title: '二、服务内容',
    content:
      '本平台基于人工智能等技术，向用户提供包括但不限于：AI 内容创作、AI 智能对话与文档生成、自媒体矩阵管理与一键发布、智能招聘、智能获客、推荐分享等功能服务（以下简称"本服务"）。我们可能根据业务发展需要增加、调整或停止部分功能，并将以合理方式提前告知。',
  },
  {
    title: '三、账号开通与安全',
    content:
      '本平台账号由管理员或代理商统一开通管理，暂不支持用户自主注册。如需使用本服务，请联系您的服务代理商或平台管理员为您开通账号。您应使用开通账号时登记的真实、准确信息，并妥善保管账号与密码，对使用该账号所进行的一切操作负全部责任。您承诺不将账号出借、转让或让他人代为操作。如发现账号存在未经授权的使用或安全漏洞，应立即通知我们。因您保管不善造成的损失，由您自行承担。',
  },
  {
    title: '四、用户行为规范',
    content:
      '您在使用本服务时，承诺遵守法律法规及本平台规则，不得利用本服务从事下列行为：1）发布、传播违反宪法和法律法规、危害国家安全、破坏社会稳定、煽动民族仇恨、宣扬暴力恐怖、涉黄赌毒等违法违规内容；2）侵犯他人知识产权、商业秘密、隐私权、名誉权等合法权益；3）利用本服务从事诈骗、虚假宣传、非法集资、传销等违法活动；4）恶意攻击、干扰本平台系统正常运行，或尝试非法访问本平台系统及数据；5）利用 AI 生成功能制作、传播虚假信息或深度合成内容而未按法律法规要求进行标识；6）其他违反法律法规或损害本平台及第三方合法权益的行为。对违反本规范的行为，我们有权视情节采取警告、限制功能、封禁账号等措施。',
  },
  {
    title: '五、AI 生成内容',
    content:
      '本平台提供的 AI 生成内容（包括文字、图片、音频、视频等）由人工智能模型自动生成，平台将按照《互联网信息服务深度合成管理规定》等法律法规要求在生成结果中标注"【智枢AI生成】"标识。AI 生成内容仅供参考，不代表本平台观点，也不构成任何专业意见或投资、法律、医疗建议。您应对使用 AI 生成内容的行为及后果自行负责，确保其内容真实合法、不侵犯第三方权益。',
  },
  {
    title: '六、知识产权',
    content:
      '本平台及服务所涉及的软件、界面设计、文字、图表、标识等知识产权归本平台运营方或相应权利人所有，未经许可，您不得复制、修改、传播或用于商业用途。您通过本平台创作或上传的内容，其知识产权归您或相应权利人所有；为向您提供服务之目的，您授予我们非独占的、可再许可的使用权限（包括存储、处理、按规定向第三方服务商传输等），该授权在您注销账号后自动终止（依法需保留的数据除外）。',
  },
  {
    title: '七、服务费用与结算',
    content:
      '本平台部分功能可能为付费服务，具体资费标准以平台页面公示为准。付费服务的开通、续费、退款等事项遵循平台公示的规则及双方另行签署的协议。我们可能根据业务调整变更资费标准，并至少提前合理期限予以公示。',
  },
  {
    title: '八、服务的变更、中断与终止',
    content:
      '我们将尽力保障本服务的持续稳定运行，但可能因系统维护、升级、网络故障、不可抗力等因素暂时中断或停止部分服务。因下列情形导致服务中断或终止的，我们不承担违约责任：1）不可抗力（包括自然灾害、政府行为、网络与电力故障等）；2）按法律法规要求或行政司法机关的命令；3）您违反本条款或平台规则被中止服务；4）您主动注销账号。',
  },
  {
    title: '九、免责声明',
    content:
      '您理解并同意：1）本服务按"现状"和"可用"原则提供，我们不对服务的绝对稳定性、完整性、准确性作任何明示或默示的保证；2）因您自身原因（包括操作不当、信息不实、账号泄露等）导致的一切后果由您自行承担；3）在法律允许的最大范围内，我们不承担因使用或无法使用本服务而产生的间接损失、附带损失或惩罚性赔偿。',
  },
  {
    title: '十、违约责任',
    content:
      '如您违反本条款，我们有权视情节采取警示、限制或终止服务、注销账号等措施，并保留依法追究法律责任的权利。因您的违约行为给本平台或第三方造成损失的，您应承担相应的赔偿责任。',
  },
  {
    title: '十一、隐私保护',
    content:
      '我们高度重视您的个人信息保护，个人信息收集、使用、存储及保护规则详见《隐私政策》。本条款与《隐私政策》共同构成您与我们之间关于本服务使用的完整协议。',
  },
  {
    title: '十二、法律适用与争议解决',
    content:
      '本条款的解释、效力及争议解决均适用中华人民共和国法律（为本条款之目的，不含港澳台地区法律）。因本条款引起的或与之相关的任何争议，双方应首先友好协商解决；协商不成的，任何一方均有权将争议提交平台运营方所在地有管辖权的人民法院诉讼解决。',
  },
  {
    title: '十三、条款的更新',
    content:
      '我们可能适时修订本条款，修订后的条款将在平台公布。重大变更将通过公告等方式另行通知。您继续使用本服务即视为接受修订后的条款。',
  },
  {
    title: '十四、联系我们',
    content:
      '如您对本条款有任何疑问，请通过邮箱 support@baizhiji.net 与我们联系，我们将在收到反馈后 15 个工作日内予以答复。',
  },
];

// 隐私政策（与电脑端一致）
const PRIVACY_SECTIONS = [
  {
    title: '一、引言',
    content:
      '智枢AI平台（以下简称"我们"）深知个人信息对您的重要性，将按照法律法规要求，采取相应的安全保护措施，尽力保护您的个人信息安全可控。本政策适用于智枢AI平台（https://baizhiji.net，包括 Web 端、移动端 App 及小程序等全部客户端形态）提供的全部服务。请您在使用我们的服务前，仔细阅读并充分理解本政策的全部内容。',
  },
  {
    title: '二、我们收集的信息',
    content:
      '在您使用智枢AI服务的过程中，我们可能收集以下类别信息：1）账号信息：由管理员或代理商为您开通账号时登记的姓名、手机号、角色、密码（加密存储）及头像等资料；2）使用信息：您的登录日志、操作记录、功能使用情况、IP 地址、设备型号与系统版本等；3）内容信息：您通过平台创作、上传、发布的内容，包括文字、图片、音频、视频及其元数据；4）第三方平台信息：当您使用矩阵管理、一键发布等功能授权绑定第三方内容平台账号时，我们可能获取该等平台账号的公开信息及发布权限；5）AI 交互信息：您与 AI 助手对话中输入的内容以及 AI 生成的输出结果。',
  },
  {
    title: '三、信息的使用目的',
    content:
      '我们仅在以下目的范围内使用您的信息：1）注册登录与账号管理，包括身份验证、权限分配与安全风控；2）向您提供 AI 内容生成、智能招聘、智能获客、推荐分享等核心功能服务；3）基于您的授权向第三方内容平台发布内容；4）优化产品体验，包括功能改进、问题排查与安全审计；5）依据法律法规要求履行合规义务。我们不会将您的个人信息用于与上述目的无关的用途。',
  },
  {
    title: '四、信息的共享、转让与公开披露',
    content:
      '我们不会向任何无关第三方出售或出租您的个人信息。仅在以下情形可能共享您的信息：1）经您事先明确授权同意；2）为实现核心功能所必需，向第三方 AI 大模型服务提供商、第三方内容平台等合作方共享必要信息（例如将您的输入内容发送至 AI 模型服务商以生成结果），此类共享以完成服务所必需为限；3）根据法律法规、司法或行政机关的强制性要求进行披露。涉及个人信息出境时，我们将按照法律法规要求履行相关程序并保障您的合法权益。',
  },
  {
    title: '五、信息的存储与保护',
    content:
      '我们存储您个人信息的服务器位于中华人民共和国境内。我们将采取包括但不限于：数据加密传输（HTTPS）、敏感信息加密存储、访问权限分级管控、操作审计日志、定期安全评估等技术与管理措施，防止您的个人信息被未经授权访问、公开披露、使用、修改、损坏或丢失。当个人信息发生泄露等安全事件时，我们将按照法律法规要求及时向您告知事件基本情况、可能的影响以及已采取的处置措施。',
  },
  {
    title: '六、Cookie 与本地存储',
    content:
      '为向您提供更好的访问体验，我们可能使用 Cookie 或类似技术存储您的登录凭证与偏好设置。您可以通过浏览器设置管理或删除 Cookie，但请注意，禁用 Cookie 可能导致部分功能无法正常使用。',
  },
  {
    title: '七、您的权利',
    content:
      '依据法律法规，您对您的个人信息享有以下权利：1）查询权：随时查阅您提交给我们的个人信息；2）更正权：发现信息有误时有权要求更正；3）删除权：在符合法定情形时要求删除个人信息；4）撤回授权：撤销您此前作出的特定授权同意；5）注销权：通过联系客服申请注销账号，我们将删除或匿名化处理您的个人信息。您可以通过 App 内"设置-账号注销"入口或联系本政策末提供的联系方式行使上述权利。',
  },
  {
    title: '八、未成年人保护',
    content:
      '我们的产品与服务主要面向成年人。若您是未满 18 周岁的未成年人，应在监护人陪同下阅读本政策，并在取得监护人同意后方可使用我们的服务。如果我们发现在未事先获得可证实的监护人同意的情况下收集了未成年人的个人信息，将尽快删除相关数据。',
  },
  {
    title: '九、AI 生成内容标识',
    content:
      '根据《互联网信息服务深度合成管理规定》等法律法规要求，平台对使用 AI 技术生成的内容（包括但不限于文字、图片、音频、视频）将按照监管要求在生成结果中标注"【智枢AI生成】"等显著标识，以便用户及社会公众识别。AI 生成内容仅供参考，不构成任何专业建议，请用户自行判断其准确性、完整性与合法性。',
  },
  {
    title: '十、政策的更新',
    content:
      '我们可能适时修订本政策。当政策发生重大变更时，我们将在平台显著位置发布公告或以其他方式通知您。修订后的政策自公布之日起生效。若您继续使用我们的服务，即视为接受修订后的政策。',
  },
  {
    title: '十一、联系我们',
    content:
      '如您对本政策或个人信息保护有任何疑问、意见或建议，或需要行使您的个人信息相关权利，请通过以下方式联系我们：邮箱 support@baizhiji.net。我们将在收到您的反馈后 15 个工作日内予以答复。',
  },
];

type LegalScreenRouteParams = {
  type: 'terms' | 'privacy';
};

type LegalScreenRoute = RouteProp<
  { Legal: LegalScreenRouteParams },
  'Legal'
>;

export default function LegalScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<LegalScreenRoute>();

  const isTerms = route.params?.type === 'terms';
  const title = isTerms ? '用户协议' : '隐私政策';
  const sections = isTerms ? TERMS_SECTIONS : PRIVACY_SECTIONS;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="#1F1B2E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>{title}</Text>
        <Text style={styles.updateDate}>
          更新日期：2026 年 8 月 24 日 | 生效日期：2026 年 8 月 24 日
        </Text>

        {sections.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <Text style={styles.footer}>
          {isTerms ? '本条款解释权归智枢AI平台运营方所有。' : '本政策解释权归智枢AI平台运营方所有。'}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F1B2E',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 6,
  },
  updateDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 24,
    color: '#555',
  },
  footer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f0f0f0',
    color: '#999',
    fontSize: 12,
  },
});
