import { assign, get, pickBy, set } from 'lodash';

import { AnyMap } from '../../types/common';
import { isValid } from '../common/validator';

export const PGConfigYaml = `parameters:
  jit: false
  unix_socket_directories: /tmp
  wal_level: logicalß
  archive_mode: true
  archive_command: source /opt/radondb/bin/postgres-ha/pgbackrest/pgbackrest-set-env.sh && pgbackrest archive-push "%p"
  archive_timeout: 60
  log_directory: pg_log
  shared_buffers: 128MB
  temp_buffers: 8MB
  log_statement: none
  work_mem: 4MB
  max_wal_senders: 6
  log_min_duration_statement: 1000
  max_connections: 100
  effective_cache_size: 4GB
  checkpoint_timeout: 5min
  vacuum_cost_limit: 200
  bgwriter_delay: 200
  wal_writer_delay: 200
  full_page_writes: on
  deadlock_timeout: 1
  log_lock_waits: on
  shared_preload_libraries: pgaudit.so,pg_stat_statements.so,pgnodemx.so
use_slots: false
recovery_conf:
  restore_command: source /opt/radondb/bin/postgres-ha/pgbackrest/pgbackrest-set-env.sh && pgbackrest archive-get %f "%p"
use_pg_rewind: true`;

export const RadonDBAppId = {
  ClickHouse: 'app-clickhouse',
  PostgreSQL: 'app-postgresql',
  MySQL: 'app-mysql',
};

export const RadonDBAppIds = Object.values(RadonDBAppId);

const AppKindToId: AnyMap = {
  ClickHouseInstallation: RadonDBAppId.ClickHouse,
  PostgreSQLCluster: RadonDBAppId.PostgreSQL,
  MysqlCluster: RadonDBAppId.MySQL,
};

export function getAppIdByKind(appKind: string) {
  return AppKindToId[appKind];
}

export function convertAppIdToName(appId: string) {
  return get(
    Object.entries(RadonDBAppId).find(([, value]) => value === appId),
    '[0]'
  );
}

// MySQL and CK
export const userNameRegx = /^[a-zA-Z][a-zA-Z0-9_]{1,25}$/;
export const userNameExcludeRegx = /^(?!root$|radondb_)/;
// PG
export const strictUserNameRegx = /^[a-z][a-z0-9-]{1,25}$/;
export const passwordRegx = /[a-zA-Z0-9!@#$%^&*_+\-=]{8,31}$/;

// yaml's json string
export const Installation = {
  [RadonDBAppId.ClickHouse]:
    '{"apiVersion":"clickhouse.radondb.com/v1","kind":"ClickHouseInstallation","metadata":{"name":"ck-cluster-11","namespace":"default"},"spec":{"configuration":{"zookeeper":{"install":true,"replica":3,"port":2181},"users":{"readonly/profile":"readonly","clickhouse/password":"c1ickh0use0perator","clickhouse/networks/ip":["127.0.0.1","::/0"],"clickhouse/profile":"default","clickhouse/quotas":"default"},"profiles":{"readonly/readonly":"1"},"quotas":{"default/interval/duration":"3600"},"settings":{"compression/case/method":"zstd","disable_internal_dns_cache":1},"clusters":[{"name":"all-nodes","layout":{"shardsCount":1,"replicasCount":2}}]},"defaults":{"templates":{"podTemplate":"pod-template-with-volume","dataVolumeClaimTemplate":"data","logVolumeClaimTemplate":"data","serviceTemplate":"chi-svc-template"}},"templates":{"serviceTemplates":[{"name":"chi-svc-template","spec":{"ports":[{"name":"http","port":8123},{"name":"tcp","port":9000}],"type":"NodePort"}}],"podTemplates":[{"name":"pod-template-with-volume","metadata":{"annotations":{"backup.velero.io/backup-volumes":"data"}},"spec":{"affinity":{"podAntiAffinity":{"preferredDuringSchedulingIgnoredDuringExecution":[{"weight":1,"podAffinityTerm":{"labelSelector":{"matchExpressions":[{"key":"clickhouse.radondb.com/chi","operator":"In","values":["clickhouse"]}]},"topologyKey":"kubernetes.io/hostname"}}]}},"containers":[{"name":"clickhouse","image":"radondb/clickhouse-server:v21.1.3.32-stable","imagePullPolicy":"IfNotPresent","volumeMounts":[{"name":"data","mountPath":"/var/lib/clickhouse"}],"resources":{"requests":{"memory":"1Gi","cpu":"500m"},"limits":{"memory":"1Gi","cpu":"500m"}}}]}}],"volumeClaimTemplates":[{"name":"data","reclaimPolicy":"Retain","spec":{"accessModes":["ReadWriteOnce"],"resources":{"requests":{"storage":"10Gi"}},"storageClassName":"csi-qingcloud"}}]}}}',
  [RadonDBAppId.PostgreSQL]:
    '{"apiVersion":"pgcluster.kubesphere.io/v1alpha1","kind":"PostgreSQLCluster","metadata":{"name":"postgresqlcluster-sample"},"spec":{"name":"test001","namespace":"pgtest","syncReplication":true,"ccpImage":"","ccpImageTag":"","replicaCount":1,"cpuLimit":"1","cpuRequest":"1","memoryLimit":"1Gi","memoryRequest":"1Gi","database":"db1","username":"pguser1","password":"pass1","restart":false,"storageConfig":"","replicaName":"","managedUser":true,"showSystemAccounts":true,"setSystemAccountPassword":false}}',
  [RadonDBAppId.MySQL]:
    '{"apiVersion":"mysql.radondb.com/v1alpha1","kind":"MysqlCluster","metadata":{"name":"sample","namespace":"default"},"spec":{"replicas":3,"mysqlVersion":"5.7","mysqlOpts":{"rootPassword":"RadonDB@123","rootHost":"localhost","user":"radondb_usr","password":"RadonDB@123","database":"randondb","initTokuDB":true,"mysqlConf":{},"resources":{"requests":{"cpu":"100m","memory":"256Mi"},"limits":{"cpu":"500m","memory":"1Gi"}}},"xenonOpts":{"image":"radondb/xenon:1.1.5-alpha","admitDefeatHearbeatCount":5,"electionTimeout":10000,"resources":{"requests":{"cpu":"50m","memory":"128Mi"},"limits":{"cpu":"100m","memory":"256Mi"}}},"metricsOpts":{"enabled":true,"image":"prom/mysqld-exporter:v0.12.1","resources":{"requests":{"cpu":"10m","memory":"32Mi"},"limits":{"cpu":"100m","memory":"128Mi"}}},"podSpec":{"imagePullPolicy":"IfNotPresent","sidecarImage":"radondb/mysql-sidecar:v2.1.0","busyboxImage":"busybox:1.32","slowLogTail":false,"auditLogTail":false,"labels":{},"annotations":{},"affinity":{},"priorityClassName":"","schedulerName":"","resources":{"requests":{"cpu":"100m","memory":"500Mi"}}},"persistence":{"enabled":true,"accessModes":["ReadWriteOnce"],"size":"10Gi"}}}',
};

export const SpecificationsOptions = [
  { label: '0.5 Core, 1 Gi', value: '500m, 1Gi' },
  { label: '1 Core, 2 Gi', value: '1000m, 2Gi' },
  { label: '2 Core, 4 Gi', value: '2000m, 4Gi' },
  { label: '4 Core, 8 Gi', value: '4000m, 8Gi' },
];
// For DeployForm
export const ValuesSchema = {
  [RadonDBAppId.ClickHouse]: {
    $schema: 'https://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: {
      specifications: {
        type: 'string',
        title: 'Specification',
        render: 'select',
        options: SpecificationsOptions,
      },
      volumeType: {
        type: 'string',
        title: 'Storage Class',
        description: 'The type of Storage Class shoud be created by platform-admin first.',
        render: 'select',
        options: [
          { label: 'qingcloud', value: 'qingcloud' },
          { label: 'qingcloud111', value: 'qingcloud111' },
        ],
      },
      volume: {
        type: 'string',
        title: 'Volume',
        render: 'slider',
        sliderMin: 0,
        sliderMax: 2048,
        sliderUnit: 'Gi',
        rowExclusive: true,
        halfRow: false,
      },
      nodes: {
        type: 'integer',
        title: 'Main Nodes',
        description: 'Range: 1 - 100',
        min: 1,
        max: 100,
        showFunc: true,
        tooltipContent: 'The database node is a business node, not a physical node.',
      },
      replicasets: {
        type: 'integer',
        title: 'Replication Nodes',
        description: 'Range: 1 - 3',
        min: 1,
        max: 3,
        showFunc: true,
      },
      username: {
        type: 'string',
        title: 'User Name',
        description:
          'The name can contain uppercase and lowercase letters, numbers and underline, and must start with a letter. The range of length is 2 to 26 characters.',
        rules: [
          {
            pattern: userNameRegx,
            message:
              'The name can contain uppercase and lowercase letters, numbers and underline, and must start with a letter. The range of length is 2 to 26 characters.',
          },
        ],
      },
      password: {
        type: 'string',
        title: 'PASSWORD',
        description:
          'The password contains uppercase and lowercase letters, number, and special character (!@#$%^&*_+-=). The range of length is 8 to 32 characters.',
        render: 'password',
        rules: [
          {
            pattern: passwordRegx,
            message:
              'The password contains uppercase and lowercase letters, number, and special character (!@#$%^&*_+-=). The range of length is 8 to 32 characters.',
          },
        ],
      },
      port: {
        type: 'integer',
        title: 'HTTP Port',
        description: 'Range: 0 - 65535',
        max: 65535,
        advanced: true,
      },
    },
  },
  [RadonDBAppId.PostgreSQL]: {
    $schema: 'https://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: {
      version: {
        type: 'string',
        title: 'Database Version',
        description: 'Select the version of the database',
        render: 'select',
        options: [
          { label: 'PostgreSQL 12', value: '12' },
          { label: 'PostgreSQL 13', value: '13' },
        ],
        rowExclusive: true,
        halfRow: true,
      },
      specifications: {
        type: 'string',
        title: 'Specification',
        render: 'select',
        options: SpecificationsOptions,
      },
      volumeType: {
        type: 'string',
        title: 'Storage Class',
        description: 'The type of Storage Class shoud be created by platform-admin first.',
        render: 'select',
        options: [
          { label: 'qingcloud', value: 'qingcloud' },
          { label: 'qingcloud111', value: 'qingcloud111' },
        ],
      },
      volume: {
        type: 'string',
        title: 'Volume',
        render: 'slider',
        sliderMin: 0,
        sliderMax: 2048,
        sliderUnit: 'Gi',
        rowExclusive: true,
        halfRow: false,
      },
      nodes: {
        type: 'integer',
        title: 'Standby Database',
        description: 'Range: 0 - 7',
        min: 0,
        max: 7,
        showFunc: true,
      },
      name: {
        type: 'string',
        title: 'Database Name',
      },
      username: {
        type: 'string',
        title: 'User Name',
        description:
          'The name can contain lowercase letters, numbers and dash, and must start with a letter. The range of length is 2 to 26 characters.',
        rules: [
          {
            pattern: strictUserNameRegx,
            message:
              'The name can contain lowercase letters, numbers and dash, and must start with a letter. The range of length is 2 to 26 characters.',
          },
        ],
      },
      password: {
        type: 'string',
        title: 'PASSWORD',
        description:
          'The password contains uppercase and lowercase letters, number, and special character (!@#$%^&*_+-=). The range of length is 8 to 32 characters.',
        render: 'password',
        rules: [
          {
            pattern: passwordRegx,
            message:
              'The password contains uppercase and lowercase letters, number, and special character (!@#$%^&*_+-=). The range of length is 8 to 32 characters.',
          },
        ],
      },
      replicateMode: {
        type: 'string',
        title: 'Replication Mode',
        description:
          'Streaming Replication establish a connection between the standby database and the primary database, in order to keep them current.',
        render: 'select',
        options: [
          { label: 'Sync', value: 'Sync' },
          { label: 'Async', value: 'Async' },
        ],
        advanced: true,
        tooltipContent: `Async indicate asynchronous stream replication mode.
Sync indicate synchronous stream replication mode.`,
      },
    },
  },
  [RadonDBAppId.MySQL]: {
    $schema: 'https://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: {
      specifications: {
        type: 'string',
        title: 'Specification',
        render: 'select',
        options: SpecificationsOptions,
      },
      volumeType: {
        type: 'string',
        title: 'Storage Class',
        description: 'The type of Storage Class shoud be created by platform-admin first.',
        render: 'select',
        options: [
          { label: 'qingcloud', value: 'qingcloud' },
          { label: 'qingcloud111', value: 'qingcloud111' },
        ],
      },
      volume: {
        type: 'string',
        title: 'Volume',
        render: 'slider',
        sliderMin: 0,
        sliderMax: 2048,
        sliderUnit: 'Gi',
        rowExclusive: true,
        halfRow: false,
      },
      nodes: {
        type: 'string',
        title: 'Standby Database',
        description: 'The number of standby database: 1, 2, 4',
        render: 'select',
        options: [1, 2, 4].map((n) => ({ label: n, value: n })),
      },
    },
  },
};

// Form default values
export const ValuesJSON = {
  [RadonDBAppId.ClickHouse]: {
    specifications: '500m, 1Gi',
    volumeType: '',
    volume: '10Gi',
    nodes: 1,
    replicasets: 2,
    username: 'clickhouse',
    password: 'c1ickh0use0perator',
    port: 8123,
  },
  [RadonDBAppId.PostgreSQL]: {
    version: '12',
    specifications: '500m, 1Gi',
    volumeType: 'qingcloud',
    volume: '10Gi',
    nodes: 1,
    name: 'radondb',
    username: 'radondbuser',
    password: 'radonDB01',
    replicateMode: 'Sync',
  },
  [RadonDBAppId.MySQL]: {
    specifications: '500m, 1Gi',
    volumeType: 'qingcloud',
    volume: '10Gi',
    nodes: 2,
  },
};

type IValuesJSON = typeof ValuesJSON;
type InstallParams = { name: string; valuesJson: IValuesJSON; namespace: string };

export function mergeCKInstallationData({ name, valuesJson, namespace }: InstallParams) {
  // merge default
  const mergedValueJson = assign({}, ValuesJSON[RadonDBAppId.ClickHouse], pickBy(valuesJson, isValid));
  let installation = Installation[RadonDBAppId.ClickHouse];
  installation = installation.replace(
    '{"name":"ck-cluster-11","namespace":"default"}',
    `{"name":"${name}","namespace":"${namespace}"}`
  );
  installation = installation.replace(/zookeeper-server.default/g, `zookeeper-server.${namespace}`);
  const { specifications, volume, volumeType, nodes, replicasets, username, password, port } = mergedValueJson;
  const { cpu, memory } = getCpuAndMemoryFromSpecifications(specifications);
  installation = installation.replace(/{"memory":"1Gi","cpu":"500m"}/g, `{"memory":"${memory}","cpu":"${cpu}"}`);
  if (volumeType) {
    installation = installation.replace('csi-qingcloud', volumeType);
  } else {
    installation = installation.replace(',"storageClassName":"csi-qingcloud"', '');
  }
  installation = installation.replace('{"storage":"10Gi"}', `{"storage":"${volume}"}`);
  installation = installation.replace(
    '{"shardsCount":1,"replicasCount":2}',
    `{"shardsCount":${Number(nodes)},"replicasCount":${Number(replicasets)}}`
  );

  if (username && password && userNameRegx.test(username) && passwordRegx.test(password)) {
    installation = installation.replace(
      '"clickhouse/password":"c1ickh0use0perator","clickhouse/networks/ip":["127.0.0.1","::/0"],"clickhouse/profile":"default","clickhouse/quotas":"default"',
      generateClickHouseUserString(username, password)
    );
  }
  installation = installation.replace('{"name":"http","port":8123}', `{"name":"http","port":${port}}`);
  return installation;
}

export function generateClickHouseUserString(username: string, password: string) {
  return `"${username}/password":"${password}","${username}/networks/ip":["127.0.0.1","::/0"],"${username}/profile":"default","${username}/quotas":"default"`;
}

export function getCpuAndMemoryFromSpecifications(specifications: string) {
  const [cpu, memory] = specifications.split(', ');
  return { cpu, memory };
}

export function mergeMySQLInstallationData({ name, valuesJson, namespace }: InstallParams) {
  const mergedValueJson = assign({}, ValuesJSON[RadonDBAppId.MySQL], pickBy(valuesJson, isValid));
  const { specifications, volume, volumeType, nodes } = mergedValueJson;
  const cm = getCpuAndMemoryFromSpecifications(specifications);
  const installationObj = JSON.parse(Installation[RadonDBAppId.MySQL]);
  set(installationObj, 'metadata.name', name);
  set(installationObj, 'metadata.namespace', namespace);
  set(installationObj, 'spec.mysqlOpts.resources.requests', cm);
  set(installationObj, 'spec.mysqlOpts.resources.limits', cm);
  set(installationObj, 'spec.replicas', nodes + 1); // 界面设置是备库数量，参数是控制pod数量
  set(installationObj, 'spec.persistence.storageClass', volumeType);
  set(installationObj, 'spec.persistence.size', volume);
  return JSON.stringify(installationObj);
}

export function getMySQLSecretCrd({ name, namespace }: { name: string; namespace: string }) {
  const secret = {
    apiVersion: 'v1',
    kind: 'Secret',
    type: 'Opaque',
    metadata: { name: `${name}-userpassword-secret`, namespace },
  };
  return JSON.stringify(secret);
}

export function mergePGInstallationData({ name, valuesJson, namespace }: InstallParams) {
  const mergedValueJson = assign({}, ValuesJSON[RadonDBAppId.MySQL], pickBy(valuesJson, isValid));
  const {
    specifications,
    name: database,
    username,
    password,
    nodes,
    replicateMode,
    volume,
    volumeType,
    version,
  } = mergedValueJson;
  const cm = getCpuAndMemoryFromSpecifications(specifications);
  const installationObj = JSON.parse(Installation[RadonDBAppId.PostgreSQL]);
  set(installationObj, 'metadata.name', name);
  set(installationObj, 'metadata.namespace', namespace);
  set(installationObj, 'spec', {
    ...installationObj.spec,
    name,
    username,
    password,
    namespace,
    database,
    cpuLimit: cm.cpu,
    cpuRequest: cm.cpu,
    memoryLimit: cm.memory,
    memoryRequest: cm.memory,
    replicaCount: nodes,
    syncReplication: replicateMode === 'Sync',
    pvcSize: volume,
    storageConfig: volumeType,
    pgVersion: version,
  });
  return JSON.stringify(installationObj);
}
