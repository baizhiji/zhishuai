#!/bin/bash
# 修复 Kotlin JVM 版本问题

echo "=== 修复 Kotlin JVM 版本配置 ==="

# 1. 添加 gradle.properties 配置
if ! grep -q "kotlin.jvm.target.validation.mode" android/gradle.properties 2>/dev/null; then
    echo "" >> android/gradle.properties
    echo "# Kotlin JVM 版本验证忽略" >> android/gradle.properties
    echo "kotlin.jvm.target.validation.mode=IGNORE" >> android/gradle.properties
    echo "已添加 kotlin.jvm.target.validation.mode=IGNORE"
else
    echo "gradle.properties 已配置"
fi

# 2. 只修改 app/build.gradle 的配置
if [ -f android/app/build.gradle ]; then
    # 确保使用 Java 17
    sed -i 's/sourceCompatibility JavaVersion.VERSION_11/sourceCompatibility JavaVersion.VERSION_17/g' android/app/build.gradle
    sed -i 's/targetCompatibility JavaVersion.VERSION_11/targetCompatibility JavaVersion.VERSION_17/g' android/app/build.gradle
    sed -i 's/sourceCompatibility = JavaVersion.VERSION_11/sourceCompatibility = JavaVersion.VERSION_17/g' android/app/build.gradle
    sed -i 's/targetCompatibility = JavaVersion.VERSION_11/targetCompatibility = JavaVersion.VERSION_17/g' android/app/build.gradle
    echo "已更新 android/app/build.gradle"
fi

echo "=== 修复完成 ==="
