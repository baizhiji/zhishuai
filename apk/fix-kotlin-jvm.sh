#!/bin/bash
# 修复 Kotlin JVM 版本问题

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

# 2. 在根 build.gradle 末尾添加子项目配置（不覆盖 Expo 配置）
if [ -f android/build.gradle ]; then
    # 检查是否已有 subprojects 配置，没有则添加
    if ! grep -q "subprojects" android/build.gradle; then
        cat >> android/build.gradle << 'EOF'

// 统一所有子项目的 Kotlin JVM 版本为 17
subprojects {
    tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
        kotlinOptions {
            jvmTarget = '17'
        }
    }
}
EOF
    fi
fi

echo "=== 修复完成 ==="
