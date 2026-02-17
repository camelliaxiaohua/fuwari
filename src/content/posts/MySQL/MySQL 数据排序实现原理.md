---
title: MySQL 数据排序实现原理
category: MySQL
tags:
  - MySQL原理
published: 2026-02-17
updated: 2026-02-17
draft: false
---
---

MySQL 排序主要有两种方式：利用索引排序和 filesort 排序。

## 1. 利用索引排序

如果 ORDER BY 的字段正好有索引，而且排序方向一致，MySQL 直接顺着 B+ 树叶子节点扫描就行，不用额外排序。

```sql
-- 假设有联合索引 (status, age)

-- ✅ 走索引排序
SELECT * FROM user ORDER BY status;                          -- 命中索引前缀
SELECT * FROM user ORDER BY status, age;                     -- 完全匹配索引顺序
SELECT * FROM user WHERE status = 1 ORDER BY age;            -- 等值条件 + 后续列排序
SELECT * FROM user ORDER BY status DESC, age DESC;           -- 方向一致（都是 DESC）

-- ❌ 无法走索引排序，需要 filesort
SELECT * FROM user ORDER BY age;                             -- 跳过了 status
SELECT * FROM user WHERE status > 1 ORDER BY age;            -- 范围查询后的列无法利用索引排序
SELECT * FROM user ORDER BY status ASC, age DESC;            -- 排序方向不一致
```

这是最理想的情况，EXPLAIN 里不会出现 `Using filesort`。

## 2. filesort 排序

无法利用索引时，MySQL 需要额外排序，这就是 filesort（名字有点误导，不一定是文件排序）。

### 2.1. 全字段排序（单路排序）

```
1. 把满足条件的行取出，包括 SELECT 的所有字段
2. 放入 sort_buffer
3. 按 ORDER BY 列排序
4. 直接返回结果
```

- **优点**：排完直接返回，不用回表
- **缺点**：占内存大

### 2.2. rowid 排序（双路排序）

```
1. 只取排序字段 + 主键 ID
2. 在 sort_buffer 中排序
3. 按排序后的 ID 回表取完整数据
```

- **优点**：sort_buffer 能放更多行
- **缺点**：多一次回表

MySQL 根据 `max_length_for_sort_data` 参数决定用哪种：行数据太长就用 rowid 排序。

> [!warning] 注意
> 如果数据量超过 `sort_buffer_size`，MySQL 会分块排序，把中间结果写到磁盘临时文件，最后归并。这时候才是真正的"文件排序"，性能会下降。

