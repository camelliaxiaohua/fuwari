---
title: StampedLock
category: Java
tags:
  - Java并发
  - 多线程
published: 2025-07-19
updated: 2025-07-19
draft:
---
---
前面介绍的`ReadWriteLock`可以解决多线程同时读，但只有一个线程能写的问题。

**在深入分析ReadWriteLock时，我们可以注意到一个潜在的问题。当有线程在读取时，写线程必须等待直到读线程释放锁之后才能获得写锁。这意味着在读取期间不允许写入，体现了一种悲观的读锁策略（即读者优先）。**

要进一步提升并发执行效率，Java 8引入了新的读写锁：`StampedLock`。

**与ReadWriteLock相比，StampedLock的改进之处在于它允许在读取过程中获取写锁进行写入。这可能导致读取的数据不一致，因此需要额外的代码来检测读取过程中是否发生了写入，这种读锁被称为乐观锁。**

乐观锁的意思就是乐观地估计读的过程中大概率不会有写入，因此被称为乐观锁。反过来，悲观锁则是读的过程中拒绝有写入，也就是写入必须等待。显然乐观锁的并发效率更高，但一旦有小概率的写入导致读取的数据不一致，需要能检测出来，再读一遍就行。

```java
public class Point {
    private final StampedLock stampedLock = new StampedLock();
    private double x;
    private double y;

    // 移动点的位置
    public void move(double deltaX, double deltaY) {
        long stamp = stampedLock.writeLock(); // 获取写锁
        try {
            x += deltaX;
            y += deltaY;
        } finally {
            stampedLock.unlockWrite(stamp); // 释放写锁
        }
    }

    // 计算点到原点的距离
    public double distanceFromOrigin() {
        long stamp = stampedLock.tryOptimisticRead(); // 获得一个乐观读锁
        // 注意：下面两行代码不是原子操作
        double currentX = x; // 假设 x, y = (100, 200)
        double currentY = y; // 此时可能存在写线程将 x, y 修改为 (300, 400)

        // 检查乐观读锁期间是否有写锁发生
        if (!stampedLock.validate(stamp)) {
            stamp = stampedLock.readLock(); // 获取一个悲观读锁
            try {
                currentX = x;
                currentY = y;
            } finally {
                stampedLock.unlockRead(stamp); // 释放悲观读锁
            }
        }
        return Math.sqrt(currentX * currentX + currentY * currentY);
    }
}
```

和`ReadWriteLock`相比，写入的加锁是完全一样的，不同的是读取。

> [!NOTE] 注意
> 注意到首先我们通过**`tryOptimisticRead()`**获取一个乐观读锁，并返回版本号。接着进行读取，读取完成后，我们通过**`validate()`**去验证版本号，如果在读取过程中没有写入，版本号不变，验证成功，我们就可以放心地继续后续操作。如果在读取过程中有写入，版本号会发生变化，验证将失败。在失败的时候，我们再通过获取悲观读锁再次读取。

由于写入的概率不高，程序在绝大部分情况下可以通过乐观读锁获取数据，极少数情况下使用悲观读锁获取数据。

> [!tip] Tips
> 显然，`StampedLock`将读锁细分为**乐观读**和**悲观读**，这样可以进一步提高并发效率。然而，这样做也有其代价。首先，代码变得更复杂；其次，StampedLock是一种不可重入的锁，无法在同一线程中多次获取同一个锁。
> - 在高写入负载的场景下，悲观读锁可能会被长期阻塞，导致读操作饥饿。
> - 如果线程使用 `writeLock()` 或者 `readLock()` 获得锁之后，线程还没执行完就被 `interrupt()` 的话，会导致 CPU 飙升，需要用 `readLockInterruptibly` 或者 `writeLockInterruptibly` 。

StampedLock也支持将悲观读锁升级为写锁的更高级功能，这主要应用于`if-then-update`场景：先进行读取，如果读取的数据符合条件，则直接返回；如果不符合条件，则尝试进行写操作。

> [!info] 内部原理
> - `StampedLock` 通过一个长整型值来管理状态，低位用于表示锁的类型（写锁、读锁），高位用于表示锁的计数。当乐观读锁被获取时，生成一个时间戳（stamp），并在后续验证时判断是否有写操作发生。
> -  `validate(stamp)` 方法可以有效判断在持有乐观读锁的情况下，是否有其他写操作干扰（被修改了），从而决定是否要变为悲观读锁。

