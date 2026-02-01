---
title: 基本类型与引用类型在 JVM 存储位置
category: Java SE
tags:
  - Java基础
published: 2026-02-01
updated: 2026-02-01
draft: false
---
---

### 1. 基本类型的存储

- **局部变量 - 存储在栈中**

```java
public void method() {
    int num = 10;        // 栈中直接存储值 10
    double price = 99.9; // 栈中直接存储值 99.9
}
```

```
栈帧（method 方法）：
├─ num: 10
└─ price: 99.9
```

- **成员变量 - 随对象存储在堆中**

```java
class Person {
    int age = 25;      // 存储在堆中的 Person 对象内
    double salary = 8000.0;
}

Person p = new Person();
```

```
栈内存：
p: 0x1234 ────────┐
                  ↓
堆内存：
0x1234 → [Person对象]
         ├─ age: 25
         └─ salary: 8000.0
```

### 2. 引用类型的存储

- **引用在栈，对象在堆**

```java
public void method() {
    String str = "Hello";
    Person person = new Person("张三");
}
```

```
栈内存（局部变量）：
├─ str: 0x5678 ────────┐
└─ person: 0x1234 ─────┼─┐
                       ↓ ↓
堆内存：
0x5678 → [String对象]
         value: "Hello"

0x1234 → [Person对象]
         name: "张三"
```

- **成员变量 - 引用和对象都在堆中**

```java
class Company {
    String name = "阿里巴巴";  // 引用在堆，对象也在堆
    Person ceo = new Person("马云");
}

Company company = new Company();
```

```
栈内存：
company: 0xAAAA ──────┐
                      ↓
堆内存：
0xAAAA → [Company对象]
         ├─ name: 0xBBBB ──────┐
         └─ ceo: 0xCCCC ───────┼─┐
                               ↓ ↓
         0xBBBB → [String对象]
                  value: "阿里巴巴"
         
         0xCCCC → [Person对象]
                  name: "马云"
```

### 3. 数组的存储

- **基本类型数组**

```java
int[] arr = new int[3];
arr[0] = 10;
arr[1] = 20;
arr[2] = 30;
```

```
栈内存：
arr: 0x1111 ────────┐
                    ↓
堆内存：
0x1111 → [int数组对象]
         ├─ length: 3
         ├─ [0]: 10
         ├─ [1]: 20
         └─ [2]: 30
```

- **引用类型数组**

```java
Person[] persons = new Person[2];
persons[0] = new Person("张三");
persons[1] = new Person("李四");
```

```
栈内存：
persons: 0x2222 ──────┐
                      ↓
堆内存：
0x2222 → [Person数组对象]
         ├─ length: 2
         ├─ [0]: 0x3333 ─────┐
         └─ [1]: 0x4444 ─────┼─┐
                             ↓ ↓
         0x3333 → [Person对象]
                  name: "张三"
         
         0x4444 → [Person对象]
                  name: "李四"
```

### 4. 包装类的存储

```java
Integer num1 = 100;  // 自动装箱
Integer num2 = 200;
```

```
栈内存：
num1: 0x1111 ─────┐
num2: 0x2222 ─────┼─┐
                  ↓ ↓
堆内存：
0x1111 → [Integer对象]
         value: 100

0x2222 → [Integer对象]
         value: 200
```

**注意：小整数缓存池（-128 ~ 127）**

```java
Integer a = 100;  // 使用缓存
Integer b = 100;  // 使用缓存
System.out.println(a == b);  // true (指向同一对象)

Integer c = 200;  // 超出缓存范围，新建对象
Integer d = 200;  // 新建对象
System.out.println(c == d);  // false (不同对象)
```
