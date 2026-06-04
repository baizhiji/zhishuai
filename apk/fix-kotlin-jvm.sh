#!/bin/bash
# 修复 Kotlin JVM 版本问题 - 更彻底的版本

echo "=== 修复 Kotlin JVM 版本配置 ==="

# 1. 添加 gradle.properties 配置
if ! grep -q "kotlin.jvm.target.validation.mode=IGNORE" android/gradle.properties 2>/dev/null; then
    echo "" >> android/gradle.properties
    echo "# 忽略 Kotlin JVM 版本验证" >> android/gradle.properties
    echo "kotlin.jvm.target.validation.mode=IGNORE" >> android/gradle.properties
fi

# 添加 Kotlin daemon 内存配置
if ! grep -q "kotlin.daemon.jvmargs" android/gradle.properties 2>/dev/null; then
    echo "" >> android/gradle.properties
    echo "# Kotlin daemon 内存" >> android/gradle.properties
    echo "kotlin.daemon.jvmargs=-Xmx2048m" >> android/gradle.properties
fi

# 2. 在根 build.gradle 末尾添加更完整的配置
if [ -f android/build.gradle ]; then
    # 检查是否已有配置，没有则添加
    if ! grep -q "subprojects" android/build.gradle; then
        cat >> android/build.gradle << 'EOF'

// 统一所有子项目的 Kotlin JVM 版本
subprojects {
    afterEvaluate { project ->
        if (project.hasProperty('android')) {
            project.android {
                compileSdkVersion rootProject.ext.compileSdkVersion
                namespace project.namespace
            }
        }
        project.tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
            kotlinOptions {
                jvmTarget = '17'
            }
        }
    }
}
EOF
    fi
fi

# 3. 确保 expo-eas-client 的 build.gradle 设置 JVM 17
if [ -f android/node_modules/expo-eas-client/android/build.gradle ]; then
    if ! grep -q "kotlinOptions" android/node_modules/expo-eas-client/android/build.gradle; then
        cat >> android/node_modules/expo-eas-client/android/build.gradle << 'EOF'

tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
    kotlinOptions {
        jvmTarget = '17'
    }
}
EOF
    fi
fi

echo "=== 修复完成 ==="
