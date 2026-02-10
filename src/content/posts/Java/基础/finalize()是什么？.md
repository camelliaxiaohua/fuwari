---
title: finalize()是什么？
category: Java
tags:
  - Java基础
published: 2026-02-07
updated: 2026-02-07
draft: false
---
---

`finalize()` 是 Object 类中的方法，在对象被垃圾回收前由 GC 调用。

### 1. 基本用法

```java
public class Resource {
    @Override
    protected void finalize() throws Throwable {
        try {
            // 释放资源
            System.out.println("对象被回收");
        } finally {
            super.finalize();
        }
    }
}
```

### 2. 执行时机

```
对象不可达 → GC 标记 → 放入 F-Queue → Finalizer 线程执行 finalize() → 下次 GC 真正回收
```

对象至少要经历两次 GC 才能被回收。

### 3. 为什么不推荐使用

1. **执行时机不确定**：GC 何时运行不可控，可能很久都不执行

```java
Resource r = new Resource();
r = null;
System.gc();  // 只是建议，JVM 可以忽略
// finalize() 可能执行，也可能不执行
```

2. **性能差**：对象回收变慢，至少两次 GC

3. **可能导致对象复活**：

```java
public class Zombie {
    static Zombie instance;
    
    @Override
    protected void finalize() {
        instance = this;  // 复活了
    }
}
```

4. **只执行一次**：复活后再次变得不可达，`finalize()` 不会再调用

5. **Finalizer 线程优先级低**：可能导致 F-Queue 堆积，内存泄漏

### 4. 正确的资源释放方式

1. **`try-with-resources`（推荐）**：

```java
try (FileInputStream fis = new FileInputStream("file.txt")) {
    // 使用资源
}
// 自动关闭
```

2. **显式 `close` + `try-finally`**：

```java
FileInputStream fis = null;
try {
    fis = new FileInputStream("file.txt");
    // 使用资源
} finally {
    if (fis != null) fis.close();
}
```

3. **Cleaner（Java 9+）**：

```java
public class Resource implements AutoCloseable {
    private static final Cleaner cleaner = Cleaner.create();
    private final Cleaner.Cleanable cleanable;
    
    public Resource() {
        cleanable = cleaner.register(this, () -> {
            // 清理逻辑
        });
    }
    
    @Override
    public void close() {
        cleanable.clean();
    }
}
```

`finalize()` 在 Java 9 被标记为 `@Deprecated`，不要在新代码中使用。

> [!quote] 扩展
> Spring 框架里还有 `DisposableBean` 接口和 `@PreDestroy` 注解，用来做 Bean 销毁时的清理工作，比依赖 GC 更可控。
