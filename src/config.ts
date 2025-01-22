import type {
  LicenseConfig,
  NavBarConfig,
  ProfileConfig,
  SiteConfig,
} from './types/config'
import { LinkPreset } from './types/config'

// 网站配置
export const siteConfig: SiteConfig = {
  title: 'BitSpark',  // 网站标题
  subtitle: 'CAMELLIA',  // 网站副标题
  lang: 'zh_CN',         // 语言设置，支持 'en', 'zh_CN', 'zh_TW', 'ja', 'ko', 'es', 'th'
  themeColor: {
    hue: 250,         // 主题颜色的色调，范围从 0 到 360，例如：红色为 0，青色为 200，品红为 345
    fixed: false,     // 是否固定主题颜色，设置为 true 后，访客无法修改主题颜色
  },
  banner: {
    enable: true,  // 是否启用横幅
    src: 'assets/images/demo-banner.png',   // 横幅图片路径，相对于 /src 目录。若以 '/' 开头，则相对于 /public 目录
    position: 'center',      // 横幅位置，支持 'top', 'center', 'bottom'，默认为 'center'
    credit: {
      enable: false,         // 是否显示横幅图片的版权信息
      text: '',              // 版权文字内容
      url: ''                // 版权链接，可选项，链接到原作品或作者的页面
    }
  },
  toc: {
    enable: true,           // 是否显示文章目录（右侧）
    depth: 2                // 显示目录的最大标题层级，1 到 3 级标题
  },
  favicon: [    // 网站图标配置，若为空数组则使用默认图标
    // {
    //   src: '/favicon/icon.png',    // 网站图标路径，相对于 /public 目录
    //   theme: 'light',              // 图标主题，可选 'light' 或 'dark'，如果为不同模式使用不同图标可设置
    //   sizes: '32x32',              // 图标尺寸，可选项
    // }
  ]
}

// 导航栏配置
export const navBarConfig: NavBarConfig = {
  links: [
    LinkPreset.Home,  // 首页链接
    LinkPreset.Archive,  // 归档链接
    LinkPreset.About,  // 关于链接
    {
      name: 'GitHub',  // GitHub 链接
      url: 'https://github.com/camelliaxiaohua',  // 链接地址
      external: true,  // 是否为外部链接，外部链接将会在新标签页打开
    },
  ],
}

// 个人资料配置
export const profileConfig: ProfileConfig = {
  avatar: 'assets/images/demo-avatar.png',  // 头像路径，相对于 /src 目录。若以 '/' 开头，则相对于 /public 目录
  name: 'CAMELLIA XIAOHUA',  // 姓名
  bio: '花有重开日，人无再少年。',  // 个人简介
  links: [
    {
      name: 'Twitter',  // Twitter 链接
      icon: 'fa6-brands:twitter',  // 图标，使用 Iconify 的图标库，具体可访问 https://icones.js.org/
      url: 'https://x.com/Camelliaxiaohua',  // 链接地址
    },
    {
      name: 'Steam',  // Steam 链接
      icon: 'fa6-brands:steam',  // 图标
      url: 'https://store.steampowered.com',  // 链接地址
    },
    {
      name: 'GitHub',  // GitHub 链接
      icon: 'fa6-brands:github',  // 图标
      url: 'https://github.com/camelliaxiaohua',  // 链接地址
    },
  ],
}

// 许可协议配置
export const licenseConfig: LicenseConfig = {
  enable: true,  // 是否启用许可协议
  name: 'CC BY-NC-SA 4.0',  // 许可协议名称
  url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',  // 许可协议的 URL
}
