import { registerRootComponent } from 'expo';

import App from './App';
import { setupGlobalErrorHandler } from './src/utils/diag';

// 设置全局 JS 错误处理器（必须在注册根组件之前调用）
setupGlobalErrorHandler();

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
