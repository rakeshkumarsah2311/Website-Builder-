<?php
$d = (array) get_option('sitecraft_data', []);
$t = fn($k) => esc_html($d[$k] ?? '');
$list = fn($k) => array_filter(array_map('trim', explode("\n", $d[$k] ?? '')));
$color = (isset($d['color']) && preg_match('/^#[0-9a-f]{6}$/i', $d['color'])) ? ' style="--a:' . $d['color'] . '"' : '';
?><!doctype html><html <?php language_attributes(); ?>><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= esc_html(($d['seoTitle'] ?? '') ?: ($d['name'] ?? get_bloginfo('name'))) ?></title>
<meta name="description" content="<?= esc_attr($d['seoDesc'] ?? '') ?>"><?php wp_head(); ?></head>
<body class="sc t<?= (int) ($d['template'] ?? 1) ?> p-<?= esc_attr(sanitize_title($d['type'] ?? 'other')) ?>"<?= $color ?>>
<header><b><?= $t('name') ?></b></header>
<section class="hero"><small><?= $t('title') ?></small><h1><?= $t('tagline') ?></h1><a class="btn" href="#contact">Get in touch</a></section>
<section class="b"><h2>About</h2><p><?= $t('about') ?></p><p><b><?= $t('years') ?></b> years of experience</p></section>
<?php foreach (['services' => 'Services', 'expertise' => 'Expertise'] as $k => $h): if ($list($k)): ?>
<section class="b"><h2><?= $h ?></h2><ul><?php foreach ($list($k) as $i) echo '<li>' . esc_html($i) . '</li>'; ?></ul></section><?php endif; endforeach; ?>
<?php if (!empty($d['why'])): ?><section class="b"><h2>Why choose me</h2><p><?= $t('why') ?></p></section><?php endif; ?>
<?php if ($list('testimonials')): ?><section class="b"><h2>Testimonials</h2><?php foreach ($list('testimonials') as $i) echo '<p><i>' . esc_html($i) . '</i></p>'; ?></section><?php endif; ?>
<section class="b" id="contact"><h2>Contact</h2><p><?= $t('phone') ?> · <?= $t('email') ?> · <?= $t('address') ?></p><p><?= $t('hours') ?></p></section>
<?php wp_footer(); ?></body></html>
