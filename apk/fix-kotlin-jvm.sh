#!/bin/bash
# 修复 Kotlin JVM 版本问题

echo "=== 修复 Kotlin JVM 版本配置 ==="

# 1. 添加 gradle.properties 配置
if ! grep -q "kotlin.jvm.target.validation.mode=IGNORE" android/gradle.properties 2>/dev/null; then
    echo "" >> android/gradle.properties
    echo "# 忽略 Kotlin JVM 版本验证" >> android/gradle.properties
    echo "kotlin.jvm.target.validation.mode=IGNORE" >> android/gradle.properties
fi

# 2. 在根 build.gradle 末尾添加配置，统一所有子项目的 Kotlin JVM 版本
if [ -f android/build.gradle ]; then
    # 检查是否已有配置
    if ! grep -q "allprojects" android/build.gradle; then
        cat >> android/build.gradle << 'EOF'

// 统一所有 Kotlin 编译的 JVM 版本
allprojects {
    tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
        kotlinOptions {
            jvmTarget = '17'
        }
    }
}
EOF
    fi
fi

# 3. 修改 app/build.gradle，添加 compileOptions
if [ -f android/app/build.gradle ]; then
    # 确保使用 Java 17
    sed -i 's/sourceCompatibility JavaVersion.VERSION_11/sourceCompatibility JavaVersion.VERSION_17/g' android/app/build.gradle
    sed -i 's/targetCompatibility JavaVersion.VERSION_11/targetCompatibility JavaVersion.VERSION_17/g' android/app/build.gradle
    
    # 确保 kotlinOptions 使用 JVM 17
    sed -i 's/jvmTarget = "11"/jvmTarget = "17"/g' android/app/build.gradle
fi

echo "=== 修复完成 ==="
