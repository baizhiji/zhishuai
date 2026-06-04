#!/bin/bash
# 修复 Kotlin JVM 版本问题

echo "=== 修复 Kotlin JVM 版本配置 ==="

# 1. 添加 gradle.properties 配置
if ! grep -q "kotlin.jvm.target.validation.mode" android/gradle.properties 2>/dev/null; then
    echo "" >> android/gradle.properties
    echo "# Kotlin JVM 版本验证忽略" >> android/gradle.properties
    echo "kotlin.jvm.target.validation.mode=IGNORE" >> android/gradle.properties
    echo "已添加 kotlin.jvm.target.validation.mode=IGNORE"
fi

# 2. 修改根 build.gradle，统一 Kotlin JVM 版本
if [ -f android/build.gradle ]; then
    # 检查是否已有 kotlin 配置
    if ! grep -q "jvmTarget = '17'" android/build.gradle; then
        # 在 subprojects 块中添加 Kotlin 配置
        if ! grep -q "subprojects" android/build.gradle; then
            cat >> android/build.gradle << 'EOF'

subprojects {
    afterEvaluate { project ->
        project.plugins.withId('kotlin-android') {
            project.tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
                kotlinOptions {
                    jvmTarget = '17'
                }
            }
        }
    }
}
EOF
        fi
        echo "已更新 android/build.gradle"
    fi
fi

# 3. 修改 app/build.gradle 的 compileOptions
if [ -f android/app/build.gradle ]; then
    # 确保使用 Java 17
    if ! grep -q "JavaVersion.VERSION_17" android/app/build.gradle; then
        sed -i 's/sourceCompatibility JavaVersion.VERSION_11/sourceCompatibility JavaVersion.VERSION_17/g' android/app/build.gradle
        sed -i 's/targetCompatibility JavaVersion.VERSION_11/targetCompatibility JavaVersion.VERSION_17/g' android/app/build.gradle
        echo "已更新 android/app/build.gradle 的 Java 版本"
    fi
    
    # 确保 kotlinOptions 使用 JVM 17
    if ! grep -q 'jvmTarget = "17"' android/app/build.gradle; then
        sed -i 's/jvmTarget = "11"/jvmTarget = "17"/g' android/app/build.gradle
        echo "已更新 android/app/build.gradle 的 Kotlin JVM 版本"
    fi
fi

echo "=== 修复完成 ==="
