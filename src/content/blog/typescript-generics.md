---
title: TypeScript 泛型的类型安全之道
description: 从约束、推断到条件类型，理清泛型在真实工程里的用法与边界。
pubDate: 2024-03-01
category: 前端
tags: [TypeScript, 类型系统]
---

泛型（Generics）是 TypeScript 类型系统里最有力的工具之一，也是最容易被误用的。它让「类型」与「具体形状」解耦，同时保留类型安全。这篇梳理几个真实工程里最常用的模式。

## 从约束开始

泛型参数默认可以是任何类型，但我们几乎总是需要约束它。用 `extends` 约束泛型参数，让类型系统知道它「至少是什么」：

```ts
function first<T extends string | number>(arr: T[]): T {
  return arr[0];
}

first([1, 2, 3]); // 推断为 number
first(['a', 'b']); // 推断为 string
```

约束的价值不只是「限制」，更重要的是它给了类型系统一个锚点，让后续的操作变得可推断。

## keyof：把键变成类型

当需要「某个对象的所有键」作为类型时，`keyof` 是最自然的表达：

```ts
function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: 'LHXXY', age: 30 };
const name = getProp(user, 'name'); // string
const age = getProp(user, 'age'); // number
```

注意 `K extends keyof T` 的约束——它让第二个参数只能传 `user` 真实存在的键，传错键会在编译期直接报错。

## 条件类型与 infer

条件类型让类型也可以「分支」，配合 `infer` 可以从类型里抽取子类型：

```ts
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type A = UnwrapPromise<Promise<string>>; // string
type B = UnwrapPromise<number>; // number
```

这套模式是很多工具类型（如 `Awaited`、`ReturnType`）的底层实现。

## 什么时候不该用泛型

泛型不是银弹。一个简单的原则：**如果类型关系没有「对应性」，就不需要泛型**。

比如下面这个签名，`T` 只出现一次，没有任何约束关系，完全可以用具体类型替代：

```ts
// 没有必要
function log<T>(value: T): void {
  console.log(value);
}

// 直接写 unknown 即可
function log(value: unknown): void {
  console.log(value);
}
```

泛型解决的是「两个位置之间的类型关联」，而不是「一个位置的类型」。

## 小结

泛型的本质是**类型参数的传递与约束**。掌握了 `extends`、`keyof` 和 `infer` 这三板斧，就能覆盖绝大多数工程场景。剩下的，是克制——只在真正需要关联关系的地方使用它。
