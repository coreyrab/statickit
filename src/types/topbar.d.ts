declare module 'topbar' {
  interface TopBarOptions {
    autoRun?: boolean;
    barThickness?: number;
    barColors?: Record<string, string>;
    shadowBlur?: number;
    shadowColor?: string;
    className?: string;
  }

  const topbar: {
    config(options: TopBarOptions): void;
    show(): void;
    hide(): void;
    progress(value?: number | string): number;
  };

  export default topbar;
}
