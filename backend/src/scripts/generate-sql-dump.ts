import * as fs from 'fs';
import * as path from 'path';

// Load the JSON backup
const backupPath = path.join(__dirname, '..', '..', 'neon_backup_latest.json');
const outputPath = path.join(__dirname, '..', '..', 'rfelectro_erp_dump.sql');

if (!fs.existsSync(backupPath)) {
  console.error('Backup file not found!');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

function escapeSql(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (val instanceof Date || (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val))) {
    return `'${new Date(val).toISOString()}'::timestamptz`;
  }
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

let sql = `-- RF ELECTRO ERP - PostgreSQL Data Dump
-- Generated on: ${new Date().toISOString()}
-- Contains: Departments, Stages, Roles, Users, Customers, Products, POs, Job Cards, Sub Job Cards, Movement Logs, Audit Logs

BEGIN;

-- Disable triggers / foreign key constraints during bulk insert
SET session_replication_role = 'replica';

`;

// Mapping Prisma model keys to SQL table and column names
const tableMappings: Record<string, { table: string; colMap: Record<string, string> }> = {
  departments: {
    table: 'departments',
    colMap: { id: 'id', name: 'name', description: 'description', isActive: 'is_active' }
  },
  processStages: {
    table: 'process_stages',
    colMap: { id: 'id', name: 'name', code: 'code', description: 'description', defaultOrder: 'default_order', departmentId: 'department_id', isActive: 'is_active' }
  },
  roles: {
    table: 'roles',
    colMap: { id: 'id', name: 'name', description: 'description' }
  },
  permissions: {
    table: 'permissions',
    colMap: { id: 'id', key: 'key', description: 'description' }
  },
  rolePermissions: {
    table: 'role_permissions',
    colMap: { roleId: 'role_id', permissionId: 'permission_id' }
  },
  users: {
    table: 'users',
    colMap: {
      id: 'id', name: 'name', email: 'email', phone: 'phone', passwordHash: 'password_hash',
      roleId: 'role_id', departmentId: 'department_id', assignedStageId: 'assigned_stage_id',
      isActive: 'is_active', createdAt: 'created_at', updatedAt: 'updated_at'
    }
  },
  processFlowMasters: {
    table: 'process_flow_masters',
    colMap: {
      id: 'id', name: 'name', totalSteps: 'total_steps', isActive: 'is_active',
      createdById: 'created_by', createdAt: 'created_at', updatedAt: 'updated_at'
    }
  },
  processFlowSteps: {
    table: 'process_flow_steps',
    colMap: {
      id: 'id', processFlowMasterId: 'process_flow_master_id', stageId: 'stage_id', stepOrder: 'step_order'
    }
  },
  customers: {
    table: 'customers',
    colMap: {
      id: 'id', companyName: 'company_name', code: 'code', contactPerson: 'contact_person',
      email: 'email', phone: 'phone', address: 'address', gstNo: 'gst_no',
      isActive: 'is_active', createdAt: 'created_at', updatedAt: 'updated_at'
    }
  },
  customerPortalAccess: {
    table: 'customer_portal_access',
    colMap: {
      id: 'id', customerId: 'customer_id', email: 'email', passwordHash: 'password_hash',
      isActive: 'is_active', lastLoginAt: 'last_login_at', createdAt: 'created_at'
    }
  },
  products: {
    table: 'products',
    colMap: {
      id: 'id', specCardNo: 'spec_card_no', revisionNo: 'revision_no', parentProductId: 'parent_product_id',
      isCurrentRevision: 'is_current_revision', revisionReason: 'revision_reason', name: 'name', code: 'code',
      customerId: 'customer_id', pcbSize: 'pcb_size', layers: 'layers', thicknessMm: 'thickness_mm',
      copperWeight: 'copper_weight', solderMask: 'solder_mask', legend: 'legend', surfaceFinish: 'surface_finish',
      materialType: 'material_type', panelSize: 'panel_size', qtyPerPanel: 'qty_per_panel',
      specialInstructions: 'special_instructions', processFlowId: 'process_flow_id', isActive: 'is_active',
      createdById: 'created_by', createdAt: 'created_at', updatedAt: 'updated_at'
    }
  },
  customerPOs: {
    table: 'customer_pos',
    colMap: {
      id: 'id', poNo: 'po_no', customerId: 'customer_id', productId: 'product_id',
      orderQty: 'order_qty', poDate: 'po_date', expectedDeliveryDate: 'expected_delivery_date',
      status: 'status', attachmentUrl: 'attachment_url', notes: 'notes', createdById: 'created_by',
      createdAt: 'created_at', updatedAt: 'updated_at'
    }
  },
  jobCards: {
    table: 'job_cards',
    colMap: {
      id: 'id', jobCardNo: 'job_card_no', customerPoId: 'customer_po_id', productId: 'product_id',
      processFlowMasterId: 'process_flow_master_id', totalQty: 'total_qty', status: 'status',
      qrCodeValue: 'qr_code_value', launchedAt: 'launched_at', completedAt: 'completed_at',
      createdById: 'created_by', createdAt: 'created_at', updatedAt: 'updated_at',
      photoUrl: 'photo_url', customerPartNo: 'customer_part_no', rfePartCode: 'rfe_part_code',
      customerCode: 'customer_code', targetDate: 'target_date', priority: 'priority',
      prodPnlQty: 'prod_pnl_qty', custPnlQty: 'cust_pnl_qty', totalPcbQty: 'total_pcb_qty',
      prodPnlAreaSqm: 'prod_pnl_area_sqm', custPnlAreaSqm: 'cust_pnl_area_sqm'
    }
  },
  subJobCards: {
    table: 'sub_job_cards',
    colMap: {
      id: 'id', subJobCardNo: 'sub_job_card_no', jobCardId: 'job_card_id',
      parentSubJobCardId: 'parent_sub_job_card_id', currentStageId: 'current_stage_id',
      qty: 'qty', qtyReceived: 'qty_received', qtyProcessed: 'qty_processed',
      qtyHold: 'qty_hold', qtyRejected: 'qty_rejected', status: 'status',
      qrCodeValue: 'qr_code_value', isRework: 'is_rework', createdById: 'created_by',
      createdAt: 'created_at', updatedAt: 'updated_at', prodPnlQty: 'prod_pnl_qty',
      custPnlQty: 'cust_pnl_qty', totalPcbQty: 'total_pcb_qty',
      prodPnlAreaSqm: 'prod_pnl_area_sqm', custPnlAreaSqm: 'cust_pnl_area_sqm'
    }
  },
  stageMovementLogs: {
    table: 'stage_movement_logs',
    colMap: {
      id: 'id', subJobCardId: 'sub_job_card_id', stageId: 'stage_id',
      qtyReceived: 'qty_received', qtyProcessed: 'qty_processed', qtyForwarded: 'qty_forwarded',
      qtyRejected: 'qty_rejected', qtyHold: 'qty_hold', rejectionReason: 'rejection_reason',
      remarks: 'remarks', remarkType: 'remark_type', qcReviewStatus: 'qc_review_status',
      qcReviewedById: 'qc_reviewed_by', qcReviewedAt: 'qc_reviewed_at', qcRemarks: 'qc_remarks',
      isOverride: 'is_override', isRework: 'is_rework', clientRequestId: 'client_request_id',
      createdById: 'created_by', createdAt: 'created_at'
    }
  },
  dispatches: {
    table: 'dispatches',
    colMap: {
      id: 'id', dispatchNo: 'dispatch_no', jobCardId: 'job_card_id', dispatchedQty: 'dispatched_qty',
      destination: 'destination', vehicleNo: 'vehicle_no', courierName: 'courier_name',
      deliveryPartner: 'delivery_partner', driverName: 'driver_name', contactNumber: 'contact_number',
      trackingLrNo: 'tracking_lr_no', dispatchRemarks: 'dispatch_remarks', deliveryStatus: 'delivery_status',
      deliveryPhotoUrl: 'delivery_photo_url', failureReason: 'failure_reason', deliveredByName: 'delivered_by_name',
      deliveredAt: 'delivered_at', receiverName: 'receiver_name', receiverMobile: 'receiver_mobile',
      deliveryRemarks: 'delivery_remarks', createdById: 'created_by', createdAt: 'created_at', updatedAt: 'updated_at'
    }
  },
  auditLogs: {
    table: 'audit_logs',
    colMap: {
      id: 'id', userId: 'user_id', action: 'action', entityType: 'entity_type',
      entityId: 'entity_id', oldValuesJson: 'old_values_json', newValuesJson: 'new_values_json',
      ipAddress: 'ip_address', userAgent: 'user_agent', createdAt: 'created_at'
    }
  }
};

for (const [key, mapping] of Object.entries(tableMappings)) {
  const rows = data[key] || [];
  if (rows.length === 0) continue;

  sql += `\n-- Table: ${mapping.table} (${rows.length} records)\n`;
  for (const row of rows) {
    const cols: string[] = [];
    const vals: string[] = [];

    for (const [prop, colName] of Object.entries(mapping.colMap)) {
      if (row[prop] !== undefined) {
        cols.push(`"${colName}"`);
        vals.push(escapeSql(row[prop]));
      }
    }

    sql += `INSERT INTO "${mapping.table}" (${cols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT DO NOTHING;\n`;
  }
}

sql += `\n-- Re-enable replication role / foreign keys\nSET session_replication_role = 'DEFAULT';\n\nCOMMIT;\n`;

fs.writeFileSync(outputPath, sql, 'utf-8');
console.log(`✅ Generated SQL dump at: ${outputPath} (${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB)`);
