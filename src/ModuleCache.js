import _ from 'lodash';
import fs from 'fs';
import glob from 'glob';
import MapCache from './MapCache';
import Module from 'module';
import path from 'path';

/*----------------------------------------------------------------------------*/

export default class ModuleCache extends MapCache {
  constructor(moduleRoot) {
    super();

    moduleRoot = _.toString(moduleRoot);
    const dirPaths = moduleRoot ? glob.sync(path.join(moduleRoot, '**/')) : [];

    _.each(dirPaths, dirPath => {
      const base = path.relative(moduleRoot, dirPath);
      const filePaths = glob.sync(path.join(dirPath, '*.js'));
      const pairs = _.map(filePaths, filePath => {
        const name = path.basename(filePath, '.js');
        return [name.toLowerCase(), name];
      });
      this.set(base, new MapCache(pairs));
    });
  }

  static resolve(id, from=process.cwd()) {
    try {
      const dirs = path.dirname(Module._resolveFilename(id, _.assign(new Module, {
        'paths': Module._nodeModulePaths(from)
      }))).split(path.sep);

      let { length } = dirs;
      while (length--) {
        const dirSub  = dirs.slice(0, length + 1);
        const dirPath = dirSub.join('/');
        const pkgPath = path.join(dirPath, 'package.json');

        if ((length && dirs[length - 1] == 'node_modules') ||
            (fs.existsSync(pkgPath) && require(pkgPath).name == id)) {
          return dirPath;
        }
      }
      return dirs.join('/');
    } catch (e) {}
    return '';
  }
};
