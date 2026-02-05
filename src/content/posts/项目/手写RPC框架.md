---
title: 手写RPC框架
category: 项目经验
tags:
  - 项目经验
published: 2026-02-02
updated: 2026-02-02
draft: false
---
---

## 1. 基本概念

### 1.1. 什么是RPC

简单来说，RPC就是**让你调用远程服务器上的代码，感觉像调用自己电脑上的代码一样简单**。

打个比方：你想吃饭，有两种方式——自己做（本地调用），或者点外卖（RPC）。点外卖时，你只需要说"我要一份炒饭"，不用关心厨师怎么做、外卖员怎么送，饭就到你手上了。

RPC做的就是这件事：你的程序说"我要调用那个服务器上的某个功能"，剩下的网络传输、数据打包拆包，RPC框架全帮你处理好，你只管用就行。

### 1.2. 为何需要RPC

- **没有RPC的时候**

假设你的订单服务需要调用库存服务查库存。你得自己写一堆代码：建立网络连接、把请求数据打包成JSON或XML、发送HTTP请求、等待响应、解析返回的数据、处理网络超时和错误……每调用一个远程服务都要写这么一套。

就像你想问朋友一个问题，但没有电话，你得自己造一台发报机、学摩斯电码、找到对方的频率、把问题翻译成电码发出去、再把回复翻译回来。

- **有了RPC之后**

这些脏活累活框架全包了。你只需要写一行类似 `inventory.checkStock(itemId)` 的代码，就像调用本地函数一样，框架自动帮你处理网络传输、数据转换、错误重试这些事情。

就像有了电话，拿起来拨号说话就行。

**所以RPC的价值就是**：把复杂的远程通信简化成简单的函数调用，让程序员专注于业务逻辑，不用操心底层网络细节。

---

## 2. RPC框架实现思路

### 2.1. 基本设计

在RPC框架中，有两个核心角色：**消费者**（调用方）和**提供者**（服务方）。

消费者想使用提供者的功能，提供者就得启动一个Web服务等着被调用。比如消费者请求`test/order`这个地址，提供者收到后就去执行`orderService`的`order`方法。

但问题来了，如果提供者有几十个服务、几百个方法，难道要写几百个接口地址？消费者也要写几百段HTTP调用代码？这也太累了。

NO，这样成本太高了，我们可以在服务提供者程序中维护一个**本地服务注册器**，记录服务和对应实现类的映射，比如。

| 服务名         | 实现类             |
| -------------- | ------------------ |
| `orderService` | `OrderServiceImpl` |
| `userService`  | `UserServiceImpl`  |

消费者只需要发一个通用请求，告诉提供者"我要调用哪个服务的哪个方法"，比如`service=orderService, method=order`。提供者收到后，查表找到对应的实现类，用Java反射机制调用指定方法。这样一个接口就能处理所有服务调用。

还有一个问题，**数据传输**。Java对象没法直接在网络上传，得先把对象变成二进制（序列化），传过去再还原（反序列化）。

最后一个优化，消费者每次调用都要手写HTTP请求、处理响应，还是麻烦。于是用代理模式，给消费者生成一个"假对象"。消费者调用这个假对象的方法，背后代理自动完成发请求、收响应的全部流程。消费者感觉就像在调用本地方法一样。

**总结一下RPC的实现思路**：

1. 提供者用服务注册器统一管理所有服务
2. 通过反射动态调用对应方法
3. 用序列化解决网络传输问题
4. 用代理模式让消费者调用更简单

![image-20260202024128308](https://camelliaxiaohua-1313958787.cos.ap-shanghai.myqcloud.com/markdown/image-20260202024128308.png)



### 2.2 扩展设计





## 3. 开发基本RPC框架

### 3.1. 公共模块

公共模块需要同时被消费者和服务提供者引入，主要是编写和服务相关的接口和数据模型。

模块结构如下：

<img src="https://camelliaxiaohua-1313958787.cos.ap-shanghai.myqcloud.com/markdown/image-20260202030112366.png" alt="image-20260202030112366" style="zoom: 80%;" />

- 用户实体类

```java
package com.bit.test.rpc.api.user.model;

import java.io.Serial;
import java.io.Serializable;


/**
 * 用户实体类
 * @Datetime: 2026年02月02日02:55
 * @Author: Eleven52AC
 */
public class User implements Serializable {

    /**
     * 序列化版本号
     */
    @Serial
    private static final long serialVersionUID = -1093604918512829670L;

    /**
     * 用户名
     */
    private String name;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}

```

- 用户服务接口

```java
package com.bit.test.rpc.api.user;

import com.bit.test.rpc.api.user.model.User;

/**
 * 用户服务接口
 * @Datetime: 2026年02月02日02:56
 * @Author: Eleven52AC
 */
public interface UserService {

    /**
     * 获取用户
     *
     * @param user
     * @return
     */
    User getUser(User user);

}
```

### 3.2. 服务提供者

服务提供者是真正实现接口的模块，此外还需要启动一个Web服务等着被调用。

<img src="C:\Users\eleven\AppData\Roaming\Typora\typora-user-images\image-20260202031031526.png" alt="image-20260202031031526" style="zoom:80%;" />

- 需要的依赖

```xml
<dependencies>
    <dependency>
        <groupId>bit</groupId>
        <artifactId>bit-test-rpc-api</artifactId>
        <version>1.0.0</version>
    </dependency>
    <dependency>
        <groupId>bit</groupId>
        <artifactId>bit-rpc-core</artifactId>
        <version>1.0.0</version>
    </dependency>
</dependencies>
```

- 服务实现类

```java
package com.bit.test.rpc.provider.service.impl;

import com.bit.test.rpc.api.user.model.User;

/**
 * 用户服务实现类
 * @Datetime: 2026年02月02日03:06
 * @Author: Eleven52AC
 */
public class UserServiceImpl {

    public User getUser(User user) {
        System.out.println("用户名：" + user.getName());
        return user;
    }

}
```

- 服务提供者启动类

```java
package com.bit.test.rpc.provider;

/**
 * 简易服务提供者示例
 */
public class EasyProviderExample {

    public static void main(String[] args) {

    }

}

```

### 3.3. 消费者

服务消费者只需要启动服务调用提供者。

<img src="https://camelliaxiaohua-1313958787.cos.ap-shanghai.myqcloud.com/markdown/image-20260202031942558.png" alt="image-20260202031942558" style="zoom:80%;" />

- 依赖

```xml
<dependencies>
    <dependency>
        <groupId>bit</groupId>
        <artifactId>bit-test-rpc-api</artifactId>
        <version>1.0.0</version>
    </dependency>
    <dependency>
        <groupId>bit</groupId>
        <artifactId>bit-rpc-core</artifactId>
        <version>1.0.0</version>
    </dependency>
</dependencies>
```

- 启动类&调用代码

```java
package com.bit.test.rpc.consumer;

import com.bit.rpc.core.proxy.ServiceProxyFactory;
import com.bit.test.rpc.api.user.UserService;
import com.bit.test.rpc.api.user.model.User;

/**
 * 简易服务消费者示例
 */
public class EasyConsumerExample {

    public static void main(String[] args) {
        // 动态代理
        UserService userService = ServiceProxyFactory.getProxy(UserService.class);
        User user = new User();
        user.setName("yupi");
        // 调用
        User newUser = userService.getUser(user);
        if (newUser != null) {
            System.out.println(newUser.getName());
        } else {
            System.out.println("user == null");
        }
    }
}
```

### 3.4. RPC框架

开发RPC框架中**服务于提供者那一侧**的功能，这部分需要一个Web服务器来接收消费者的请求。

这里使用高性能的NIO Vert.x 框架来作为RPC的Web服务器。

> [!quote] 官方文档
> [Vert.x 官方文档](https://vertx.io/)



