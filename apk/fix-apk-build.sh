#!/bin/bash
# 修复 APK 构建 JVM 版本不一致问题

echo "=== 1. 修改 gradle.properties ==="
cat >> /www/zhishuai/apk/android/gradle.properties << 'EOF'

# JVM 版本统一配置
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m -XX:+HeapDumpOnOutOfMemoryError

# Kotlin JVM 版本配置
kotlin.jvm.target.validation.mode=IGNORE
EOF

echo "=== 2. 修改 app/build.gradle 添加 compileOptions ==="
# 在 namespace 行后添加 compileOptions 和 kotlinOptions
sed -i "s/namespace 'com.baizhiji.zhishuai'/namespace 'com.baizhiji.zhishuai'\n    compileOptions {\n        sourceCompatibility JavaVersion.VERSION_17\n        targetCompatibility JavaVersion.VERSION_17\n    }\n    kotlinOptions {\n        jvmTarget = \"17\"\n    }/" /www/zhishuai/apk/android/app/build.gradle

echo "=== 3. 清理并构建 ==="
cd /www/zhishuai/apk/android
./gradlew clean
./gradlew assembleDebug

echo "=== 构建完成 ==="
if [ -f "/www/zhishuai/apk/android/app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo "APK 生成成功: /www/zhishuai/apk/android/app/build/outputs/apk/debug/app-debug.apk"
    ls -lh /www/zhishuai/apk/android/app/build/outputs/apk/debug/app-debug.apk
else
    echo "APK 未找到，请检查构建日志"
fi
