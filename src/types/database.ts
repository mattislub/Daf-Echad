export interface DatabaseSchemaColumn {
  name: string;
  type: string;
  nullable: boolean;
  key: string;
  extra: string;
  default: string | number | null;
}

export interface DatabaseSchemaTable {
  name: string;
  type: string;
  columns: DatabaseSchemaColumn[];
}
