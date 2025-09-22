---
title: 配置中心延迟加载导致的 Bean 初始化问题
published: 2025-08-01
updated: 2025-08-05
tags:
  - Tips
category: Spring Cloud
---

---

### 1. 问题场景

煮包在搭建 `Spring Cloud` 项目时，选择使用 `Nacos` 作为配置中心，并将所有配置项（包括 `Redis` 配置）统一迁移到了配置中心中。
 理想情况下，煮包希望应用启动后能顺利地从 `Nacos` 获取所有配置，然后“美美地”运行起来。

但现实往往不如人意。应用刚一启动，控制台就爆红，打破了煮包的幻想。
 煮包发现程序在尝试连接 `Redis` 时，一直连接的是本地 `localhost:6379`，而不是配置中心中定义的远程地址。

排查发现服务确实已经成功从 `Nacos` 拉取到了配置，这让煮包一度陷入了迷茫。
 好在煮包冷静下来，经过一顿 Google + AI 搜索，终于找到了问题根源：这其实是一个经典的 ——

> **配置加载时机问题（Configuration Load Timing Issue）**。

<img src="https://camelliaxiaohua-1313958787.cos.ap-shanghai.myqcloud.com/markdown/image-20250725175655832.png" alt="image-20250725175655832" style="zoom:50%;" />

![image-20250725175755899](https://camelliaxiaohua-1313958787.cos.ap-shanghai.myqcloud.com/markdown/image-20250725175755899.png)

在 `Spring Cloud` 应用中，部分 `Bean`（如 `Redis`、`Kafka`、`DataSource` 等）会在应用上下文刷新早期由自动配置（`AutoConfiguration`）完成初始化。
 如果这些 `Bean` 所依赖的配置项存在于远程配置中心（如 `Nacos`、`Apollo`、`Consul`）中，**但配置中心未能及时完成加载**，就会导致：

- `Bean` 使用默认配置进行初始化；
- 虽然后续配置成功加载，但已初始化的 `Bean` 不会自动更新配置；
- 因此可能出现连接 `Redis` 或其他中间件失败的异常情况。

### 2. 问题解决

既然明确了问题的根源在于 `Bean` 在远程配置加载完成之前就被提前创建了，那么解决方案就是让该 `Bean` 实现延迟初始化，确保它在配置中心的数据完全加载并注入之后再开始实例化。通常情况下，自定义的 `@Bean` 定义其加载时机是在所有配置加载完毕且自动配置执行之后，这样我们可以通过显式引用配置属性（例如使用 `@Value` 或 `@ConfigurationProperties` 注解）来保证配置中心的数据已经注入到 `Bean` 中。

> 需要注意的是，虽然自定义 `Bean` 的加载时机理论上晚于配置加载和自动装配，因此一般能缓解配置加载延迟问题，但在实际应用中仍可能出现部分自定义 `Bean` 开始初始化时，配置尚未完全加载的情况。因此，延迟初始化虽然是常用且有效的手段，但并非在所有场景下都能完全避免此类时序问题，必要时还需结合其他机制（如事件监听、条件判断等）来保证配置的正确注入。



![](https://camelliaxiaohua-1313958787.cos.ap-shanghai.myqcloud.com/markdown/%E4%B8%8B%E8%BD%BD.jpg)

由于在`SpringBoot`中，`Redis`默认使用的`Lettuce`客户端。而`LettuceConnectionFactory` 是 `Spring Data Redis` 提供的一个 **`Redis` 连接工厂类**，用于创建和管理 `Redis` 客户端连接，默认情况下它是由`Spring Boot` 会自动创建。煮包的问题恰恰是`Nacos` 配置还没加载时，`Spring Boot` 提前初始化了 `LettuceConnectionFactory`，导致使用的默认值，所以这里我们自动`Bean`。

```java
package mscloud.config;

import com.alibaba.nacos.common.utils.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisPassword;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;

/**
 * Redis 配置类
 * <p>
 * 该配置类用于配置 Redis 连接，支持从 Nacos 配置中心动态加载 Redis 连接参数。
 * 使用 Lettuce 作为 Redis 客户端，提供高性能的异步连接支持。
 * </p>
 *
 * <p>配置项说明：</p>
 * <ul>
 *   <li>spring.redis.host - Redis 服务器地址</li>
 *   <li>spring.redis.port - Redis 服务器端口</li>
 *   <li>spring.redis.password - Redis 认证密码（可选）</li>
 *   <li>spring.redis.database - Redis 数据库索引</li>
 * </ul>
 *
 * @author Eleven52AC
 * @version 1.0
 * @since 2025-01-01
 */
@Configuration
public class RedisConfig {

    /**
     * Redis 服务器主机地址
     * <p>
     * 从配置中心获取 Redis 服务器的 IP 地址或域名
     * </p>
     */
    @Value("${spring.redis.host}")
    private String host;

    /**
     * Redis 服务器端口号
     * <p>
     * Redis 服务器监听的端口，默认为 6379
     * </p>
     */
    @Value("${spring.redis.port}")
    private int port;

    /**
     * Redis 认证密码
     * <p>
     * Redis 服务器的认证密码，如果 Redis 未设置密码则为空字符串。
     * 使用默认值空字符串，避免在未配置密码时出现配置加载异常。
     * </p>
     */
    @Value("${spring.redis.password:}")
    private String password;

    /**
     * Redis 数据库索引
     * <p>
     * 指定连接到 Redis 的哪个数据库，Redis 默认有 16 个数据库（索引 0-15）
     * </p>
     */
    @Value("${spring.redis.database}")
    private int database;

    /**
     * 创建 Lettuce 连接工厂
     * <p>
     * 根据配置参数创建 Redis 连接工厂，该工厂用于创建和管理 Redis 连接。
     * Lettuce 是一个基于 Netty 的高性能 Redis 客户端，支持同步、异步和响应式编程模式。
     * </p>
     *
     * <p>配置特性：</p>
     * <ul>
     *   <li>支持单机 Redis 配置</li>
     *   <li>支持密码认证（当配置了密码时）</li>
     *   <li>支持指定数据库索引</li>
     *   <li>基于 Lettuce 客户端，提供连接池支持</li>
     * </ul>
     *
     * @return LettuceConnectionFactory Redis 连接工厂实例
     * @throws IllegalArgumentException 当配置参数无效时抛出
     *
     * @see LettuceConnectionFactory
     * @see RedisStandaloneConfiguration
     */
    @Bean
    public LettuceConnectionFactory lettuceConnectionFactory() {
        // 创建 Redis 独立配置对象
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        // 设置 Redis 服务器地址和端口
        config.setHostName(host);
        config.setPort(port);
        // 设置数据库索引
        config.setDatabase(database);
        // 如果配置了密码，则设置认证密码
        if (StringUtils.hasText(password)) {
            config.setPassword(RedisPassword.of(password));
        }
        // 创建并返回 Lettuce 连接工厂
        return new LettuceConnectionFactory(config);
    }
}
```

煮包运行程序可以看到成功的读取配置，并且`Redis`使用的是我们的远程配置，哈哈哈，煮包最终还是美起来了。

<img src="https://camelliaxiaohua-1313958787.cos.ap-shanghai.myqcloud.com/markdown/image-20250725175917281.png" alt="image-20250725175917281" style="zoom:50%;" /> 

### 3. 极端场景

尽管上述方案在大多数情况下可以缓解由于配置延迟加载引发的问题，但仍存在一定概率，在配置尚未完成注入时，自定义 `Bean` 已被提前初始化，可能导致依赖项异常或初始化失败。针对这一场景，目前搜索和整理出以下几种常见的应对策略，尚未逐一验证效果：

- 使用 `@Lazy` 注解，将 `Bean` 设置为懒加载，避免在容器启动阶段被提前实例化；
- 使用 `@RefreshScope`，使 `Bean` 延迟到首次使用时才初始化，并支持配置变更时自动刷新；
- 实现 `ApplicationListener<ApplicationReadyEvent>` 接口，将依赖配置的初始化逻辑延迟到 `Spring` 容器完全启动后执行；
- 使用 `@ConditionalOnProperty` 控制 `Bean` 创建，仅在指定配置项已存在时才加载对应 `Bean`。

> [!NOTE]
>
> 以上内容仅基于当前理解整理，如有错误欢迎评论区指出，也欢迎补充其他更优方案，一起学习交流～
