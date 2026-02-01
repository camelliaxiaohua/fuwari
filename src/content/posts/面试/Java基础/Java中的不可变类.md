---
title: Java中的不可变类
category: Java SE
tags:
  - Java基础
published: 2026-02-01
updated: 2026-02-01
draft: false
---
---

Java中的不可变类（Immutable Class）是指对象一旦创建，其状态就不能被修改的类。

### 1. 核心特征

1. **所有字段都是`final`和`private`**；
2. **不提供`setter`方法**；
3. **类本身是`final`的**（防止子类破坏不可变性）；
4. **如果包含可变对象引用，需要防御性拷贝**。

### 2. 典型例子

`String`、`Integer`、`BigDecimal`等包装类都是不可变类。

### 3. 创建示例

```java
public final class Person {
    private final String name;
    private final int age;
    private final List<String> hobbies;

    public Person(String name, int age, List<String> hobbies) {
        this.name = name;
        this.age = age;
        // 防御性拷贝
        this.hobbies = new ArrayList<>(hobbies);
    }

    public String getName() { return name; }
    public int getAge() { return age; }
    
    // 返回副本，防止外部修改
    public List<String> getHobbies() {
        return new ArrayList<>(hobbies);
    }
}
```

- **线程安全**：无需同步
- **可作为Map的key或Set元素**
### 4. Java 14+ 简化方式

使用Record可以快速创建简单的不可变类：

```java
public record Point(int x, int y) {}
```