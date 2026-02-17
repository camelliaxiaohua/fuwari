---
title: Semaphore信号量
category: Java
tags:
  - Java并发
  - 信号量
  - 多线程
published: 2024-02-02
updated: 2024-02-02
draft: false
---
---
## 1. Semaphore信号量

前面我们讲了各种锁的实现，本质上锁的目的是保护一种受限资源，保证同一时刻只有一个线程能访问（`ReentrantLock`），或者只有一个线程能写入（`ReadWriteLock`）。

> [!WARNING]
> **存在一种资源限制，它确保同一时间最多只有N个线程可以访问。例如，同一时间最多只能创建100个数据库连接，或者最多允许10个用户同时下载等。**

这种限制数量的锁，如果用Lock数组来实现，就太麻烦了。

这种情况就可以使用`Semaphore`，例如，最多允许3个线程同时访问。

```java
public class AccessLimitControl {
    // 任意时刻仅允许最多3个线程获取许可:
    final Semaphore semaphore = new Semaphore(3);

    public String access() throws Exception {
        // 如果超过了许可数量,其他线程将在此等待
        semaphore.acquire();
        try {
            // TODO
            return UUID.randomUUID().toString();
        } finally {
            semaphore.release();
        }
    }
}
```

使用`Semaphore`先调用`acquire()`获取，然后通过`try ... finally`保证在`finally`中释放。

调用`acquire()`可能会进入等待，直到满足条件为止。

也可以使用`tryAcquire()`指定等待时间：

```java
if (semaphore.tryAcquire(3, TimeUnit.SECONDS)) {
    // 指定等待时间3秒内获取到许可:
    try {
        // TODO:
    } finally {
        semaphore.release();
    }
}
```

## 2. Semaphore 的本质

`Semaphore`本质上就是一个**信号计数器**，用于限制同一时间的最大访问数量。

Semaphore 底层依赖 **AQS（AbstractQueueSynchronizer）**，将 AQS 的 `state` 字段作为许可证（permit）计数器。
	
- `acquire()`：CAS 将 state 减 1，若 state < 0 则线程入队阻塞。
	
- `release()`：CAS 将 state 加 1，唤醒等待队列中的线程。

## 3. 公平与非公平策略

假设 Semaphore 许可数为 1，线程 A 正持有许可，线程 B 和 C 在队列中等待。此时 A 释放许可，恰好线程 D 也来请求。
在公平模式下，D 会先检查等待队列，发现 B 和 C 排在前面，于是老老实实去队尾等待，许可会按顺序给 B。在非公平模式下，D 不管队列里有谁，直接尝试获取许可。如果 CAS 成功，D 就插队拿走了许可；B 虽然等了很久，还得继续等。

```java
// 非公平（默认）
Semaphore semaphore = new Semaphore(3);

// 公平
Semaphore semaphore = new Semaphore(3, true);
```


### 3.1. 底层实现原理

Semaphore 内部有两个实现类：FairSync 和 NonfairSync，都继承自 AQS。它们的核心差异体现在 `tryAcquireShared` 方法中。

非公平实现非常直接：计算剩余许可数，如果够用就 CAS 扣减，不够就返回负数表示失败。整个过程完全不关心等待队列的情况。

公平实现则多了一步前置检查：在尝试获取许可之前，先调用 `hasQueuedPredecessors()` 看看队列中是否有其他线程在等待。如果有，即使当前许可充足，也直接放弃获取，转而去队列排队。这一步检查就是公平性的保障。

### 3.2. 性能差异的根源

非公平策略的性能优势来自于减少了线程切换。当一个线程释放许可时，唤醒等待队列中的线程需要操作系统介入，涉及上下文切换，通常要花费几微秒。在这段时间里，如果有新线程直接获取到许可并快速执行完毕，整体吞吐量就提高了。

但这种"插队"行为可能导致队列中的线程长时间得不到许可，出现饥饿现象。在高并发场景下，如果不断有新线程涌入，老线程可能会等待很久。

大多数限流场景使用默认的非公平策略即可，比如数据库连接池、接口并发控制等，追求的是整体吞吐量。只有当业务要求严格的先来后到，或者不能容忍任何请求等待过久时，才需要启用公平模式。要记住，公平是有代价的，它会降低系统的整体处理能力。

这几条注意事项整理得很清晰准确，我补充一点细节后帮你输出：

## 4. 注意事项

1. **`acquire` 和 `release` 必须成对出现。** 如果获取了许可却忘记释放，这个许可就永久丢失了。当所有许可都被"泄漏"后，其他线程会永远阻塞在 `acquire` 上，整个限流机制就瘫痪了。推荐用 `try-finally` 结构确保释放：

```java
semaphore.acquire();
try {
    // 业务逻辑
} finally {
    semaphore.release();
}
```

2. **`release` 不校验调用者身份。** 这是 Semaphore 和 ReentrantLock 的重要区别。ReentrantLock 释放时会检查当前线程是否持有锁，不是持有者会抛异常。但 Semaphore 的 `release` 就是单纯地给计数器加一，不管你有没有调用过 `acquire`。如果 `release` 调用次数比 `acquire` 多，许可数会超过初始值。比如初始化 5 个许可，多调用两次 `release` 就变成 7 个，限流语义直接被破坏。

3. **`tryAcquire` 返回 `false` 要正确处理。** `tryAcquire` 是非阻塞获取，拿不到许可会立即返回 `false` 而不是等待。如果代码里忽略这个返回值直接往下执行业务逻辑，就相当于绕过了限流，可能引发资源竞争或系统过载。正确做法是获取失败时走降级逻辑或直接返回。