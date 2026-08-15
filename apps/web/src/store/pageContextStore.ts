import { create } from 'zustand';

interface PageContextState {
  activeRoute: string;
  pageTitle: string;
  visiblePageData: any;
  setPageContext: (route: string, title: string, data: any) => void;
}

export const usePageContextStore = create<PageContextState>((set) => ({
  activeRoute: '/',
  pageTitle: 'Home',
  visiblePageData: {},
  setPageContext: (route, title, data) => set({ activeRoute: route, pageTitle: title, visiblePageData: data }),
}));
