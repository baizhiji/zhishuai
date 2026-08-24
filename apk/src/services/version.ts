// 统一应用版本号来源，避免前端多处硬编码不一致
import appJson from '../../app.json';

export const APP_VERSION = appJson.expo.version;
export const APP_VERSION_CODE = appJson.expo.android?.versionCode ?? 1;
