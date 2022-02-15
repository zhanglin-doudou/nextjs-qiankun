import request, { EHttpMethods } from '../../api/fetcher';
import { AnyMap } from '../../types/common';
import {
  RadonDBAppId,
  getMySQLSecretCrd,
  mergeCKInstallationData,
  mergeMySQLInstallationData,
  mergePGInstallationData,
} from './installation';

type Params = {
  app_id: string;
  name: string;
  conf: AnyMap;
  version_id: string;
  description: string;
  namespace: string;
};
interface Props<T> {
  params: Params;
  setDeployResult?: (data: T | undefined) => void;
  setLoading?: (loading: boolean) => void;
}

export function deploy<T = unknown>(props: Props<T>) {
  const { app_id, name, conf, version_id, description, namespace } = props.params;
  const manifest = {
    name,
    description,
    version: 1,
    appVersion: '',
    customResource: '{}',
    relatedResources: [{ name: '', data: '' }],
  };
  manifest.appVersion = version_id;
  if (namespace) {
    switch (app_id) {
      case RadonDBAppId.ClickHouse:
        manifest.customResource = mergeCKInstallationData({
          name,
          valuesJson: conf,
          namespace,
        });
        break;
      case RadonDBAppId.PostgreSQL: {
        manifest.customResource = mergePGInstallationData({
          name,
          valuesJson: conf,
          namespace,
        });
        break;
      }
      case RadonDBAppId.MySQL: {
        manifest.customResource = mergeMySQLInstallationData({
          name,
          valuesJson: conf,
          namespace,
        });
        manifest.relatedResources = [{ name: 'secret', data: getMySQLSecretCrd({ name, namespace }) }];
        break;
      }
      default:
        break;
    }
  }
  const { setLoading, setDeployResult } = props;
  setLoading && setLoading(true);
  request('/papis/radondb.com/v1/namespaces/default/manifests', { method: EHttpMethods.POST, data: manifest })
    .then((data) => {
      setDeployResult && setDeployResult(data as T);
      setLoading && setLoading(false);
    })
    .catch(() => {
      setDeployResult && setDeployResult(undefined);
      setLoading && setLoading(false);
    });
  return null;
}
