import { pageNames, componentNames, HTMLContainers } from '../config/constants';

export type PageNamesMap = typeof pageNames;
export type PageName = PageNamesMap[keyof PageNamesMap];

export type ComponentNamesMap = typeof componentNames;
export type ComponentName = ComponentNamesMap[keyof ComponentNamesMap];

export type HTMLContainersMap = typeof HTMLContainers;
export type HTMLContainer = HTMLContainersMap[keyof HTMLContainersMap];
