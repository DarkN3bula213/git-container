import { DynamicKey, getDynamicKey } from '@/data/cache/keys';
import { getJson, setJson } from '@/data/cache/querry';

import { ClassModel } from './class.model';
import { Logger } from '@/lib/logger';
import cache from '@/data/cache'


function getKeyForPath(path: string) {
  return getDynamicKey(DynamicKey.CLASS, path);
}

export async function setClass(path: string, value: any) {
  return await setJson(getKeyForPath(path), value);
}

export async function getClass(path: string) {
  return await getJson(getKeyForPath(path));
}

export async function getCachedClasses() {
  let classes = await cache.keys(getDynamicKey(DynamicKey.CLASS, '*'));

  logger.debug({
    message: 'Caching classes',
    data: classes,
  });
  if (!classes || classes.length == 0) {
    try {
      const data = await ClassModel.find().lean().exec();
      await setJson(getKeyForPath('*'), data);
      logger.debug({
        message: 'Caching classes',
        data: data,
      });
      return data;
    } catch (e) {
      logger.error({
        message: 'Error caching classes',
        data: e,
      });
    }
  } else {
    return classes;
  }
}

const logger = new Logger(__filename);
