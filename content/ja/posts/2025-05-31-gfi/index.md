---
date: '2025-05-31T22:00:00+09:00'
draft: false
title: はじめての コントリビューション
tags: [tech, rust, rustfmt, oss]
showtoc: true
---

この度はじめて OSS に Pull request を送り、無事マージされました！
これまで OSS へのコントリビューションにハードルを感じていましたが、いざやってみると思ったよりもハードルが高くありませんでした。
簡単な流れを書いておこうと思います。

## やってみる

### 取り組む OSS を選ぶ

去年くらいから Rust を少しずつ触っているのですが、便利な開発ツールにいつも感動していました。
今回は [rustfmt](https://github.com/rust-lang/rustfmt) という、 rust-lang 配下のコード整形ツールのリポジトリを見てみることにしました。

### `good first issue` をみつける

さっそくリポジトリの Issue を見ます。 Open な Issue のうち、 `good first issue` ラベルでフィルタします。
今回は該当するすべての Issue ですでに議論が行われていました...

ここで諦めかけますが、残った気力で [最新の Issue](https://github.com/rust-lang/rustfmt/issues/6202) をのぞいてみます。

### Issue の内容を把握する

`if let` の整形エラーが報告されています: 

```rust
impl EarlyLintPass for NeedlessContinue {
    fn check_expr(&mut self, cx: &EarlyContext<'_>, expr: &Expr) {
        // 長い pattern です。ここが整形できない様子。
        if let ExprKind::Loop(body, label, ..) | ExprKind::While(_, body, label) | ExprKind::ForLoop { body, label, .. } =
            &expr.kind
            && !in_external_macro(cx.sess, expr.span)
        {
            check_final_block_stmt(cx, body, label, expr.span.ctxt());
        }
    }
}
```

`max_width = 120` と設定したときに、`        if let ExprKind::Loop(body, label, ..) | ExprKind::While(_, body, label) | ExprKind::ForLoop { body, label, .. } =` （122文字）がうまく整形できないようです。
` =` の長さ（2文字です）が考慮されていないために、 `if let` と ` =` の間の整形に文字数を使い過ぎてしまうようです。

この Issue には1年前にアサインされている人がいますが、[Pull request](https://github.com/rust-lang/rustfmt/pull/6224) がそのままになっています。
これを見てみると、コードレビューを受けた後、 Git の操作まわりでつまずいてしまっているようです。
怒涛の `force push` の跡。
初心者の方でしょうか（自分もはじめてのプルリクエストで同じことをしてしまったら、パニックになってしまうと思います）。

Contributor の方がやさしく指導されていますが、その後心が折れてしまったのか目立った動きはありません。
その後、別の方が何度かやり取りされていますが、やや殺伐とした雰囲気です（ヒィー）。

しかし、ほとんど修正が完了している Pull request が放置されているのはもったいない。
代わりに自分が取り組むことにします。

### Fork/Clone してくる

ここから実際の作業に入ります。
この辺は [OSS Gate](https://kyotorb.connpass.com/event/311939/) で手取り足取り教えていただいたので余裕です（ [あのときの Pull request](https://github.com/rust-lang-ja/book-ja/pull/246) はまだマージされていませんが...）。

まずは rustfmt を Fork してきます。
手元のマシンに Clone します。
```sh
nishimi@MacBook-Air ~ % ghq get git@github.com:ynishimi/rustfmt.git
...
warning: the following paths have collided (e.g. case-sensitive paths
on a case-insensitive filesystem) and only one from the same
colliding group is in the working tree:

  'tests/source/reorder_modules/ABCD/mod.rs'
  'tests/source/reorder_modules/abcd/mod.rs'
  'tests/source/reorder_modules/ZYXW/mod.rs'
  'tests/source/reorder_modules/zyxw/mod.rs'
  'tests/target/reorder_modules/ABCD/mod.rs'
  'tests/target/reorder_modules/abcd/mod.rs'
  'tests/target/reorder_modules/ZYXW/mod.rs'
  'tests/target/reorder_modules/zyxw/mod.rs'
```

ファイルシステムが case-insensitive であることによるファイルの衝突が生じました😢
case-sensitive なボリュームを作成して、 Clone しなおします。

### エラーを再現する

準備ができたら、エラーを確認していきます。
[Contributing.md](https://github.com/rust-lang/rustfmt/blob/master/Contributing.md) を見て、まずはソースコードから rustfmt を実行する方法を調べます:

```sh
cargo run --bin rustfmt -- path/to/file.rs
```

Issue にあったコードをコピーしてきて rustfmt を実行してみると、確かにエラーが生じました:

```sh
nishimi@MacBook-Air rustfmt % cargo run --bin rustfmt -- ../test_fmt/src/test.rs 
   Compiling rustfmt-nightly v1.8.0 (/Volumes/dev/rustfmt)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 2.41s
     Running `target/debug/rustfmt ../test_fmt/src/test.rs`
Warning: the `version` option is deprecated. Use `style_edition="2024"` instead.
error[internal]: line formatted, but exceeded maximum width (maximum: 120 (see `max_width` option), found: 122)
 --> /Volumes/dev/test_fmt/src/test.rs:3:3:121
  |
3 |         if let ExprKind::Loop(body, label, ..) | ExprKind::While(_, body, label) | ExprKind::ForLoop { body, label, .. } =
  |                                                                                                                         ^^
  |

warning: rustfmt has failed to format. See previous 1 errors.
```

### コードを修正する

では、コードを修正していきます。
`git checkout -b max_width_split` で作業用のブランチを作成しました。

今回はすでにレビュー済みの Pull request が存在しているため、これを参考に修正していきます。
Pull request でも触れられていましたが、今回の変更は`StyleEdition::Edition2027`以上でのみ有効となるように [Gate](https://github.com/rust-lang/rustfmt/blob/master/Contributing.md#gate-formatting-changes) しておきます。

### テストを作成する

rustfmt では [テストケースの作成](https://github.com/rust-lang/rustfmt/blob/master/Contributing.md#create-test-cases) が必要のようです。
`./tests/source/` 下に整形前のコード、 `./tests/target/` に整形後のコードを置きます。

`cargo test` を実行し、エラーが生じないことを確認できました！

### Pull request を作成する

これまでの変更をコミットして、 [Pull request](https://github.com/rust-lang/rustfmt/pull/6572) を作成します。
今回はもととなる Issue と Pull request に触れながら、変更点をまとめました。

### Merge されるのを待つ

無事 Merge されました☺️
今回は簡単な修正でしたが、自分のコードが rustfmt で動いているというのは嬉しいものです。

![無事 Merge されました](successfully_merged.png)

## わかったこと

### 初心者もいる

今回実際にコントリビューションを行ってみて最も感じたのは、自分が思っているよりも初心者の方が多いということでした。
自分が Pull request を作成するにあたって、過去に Merge されたものをいくつか確認しましたが、 Description を描き慣れていない人やコードレビューでガッツリコメントされている人、途中で他の Contributor に助けてもらう人など、いろいろな人がいました。
また rustfmt リポジトリは Contributor の方がやさしくコメントをしてくださるので、あまり経験がない人でも気負わずにコントリビューションが行える環境であると感じました。

### Issue は意外と放置されている

今回扱った Issue のように、何らかの理由で放置されているものは意外とたくさんあるように感じました。
放置されている Issue を拾っていくのは OSS のコントリビューション経験が浅い方でも比較的取り組みやすいと思います。

## むすび

普段使っているツールの中身を見たり、修正を加えたりするのは楽しい作業でした。
今後も自分ができる範囲でコントリビューションを行っていきたいです。