import { Component } from '@angular/core';
import { rolemodel } from '../model/role.model';
import { permissionmodel } from '../model/permission.model';
import { roleservice } from '../service/role.service';
import { permissionservice } from '../service/permission.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { rolepermissionservice } from '../service/rolepermission.service';

@Component({
  selector: 'app-role',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './role.component.html',
  styleUrls: ['./role.component.css']
})
export class RoleComponent {
  title = "Rôles & Permissions";

  roles: rolemodel[] = [];
  role: rolemodel = new rolemodel();           
  permissions: permissionmodel[] = [];
  permission : permissionmodel = new permissionmodel();


  addingRole = false;
  addingPermission = false;
  editingRoleCode: string | null = null;
  editingPermissionCode: string | null = null;

  selectedRole: rolemodel | null = null;
  rolePermissions: string[] = []

  constructor(
    private rol: roleservice,
    private per: permissionservice,
    private rp : rolepermissionservice,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRoles();
    this.loadPermissions();
  }

  refreshpage(){
    const currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
    this.router.navigate([currentUrl]);
    });
  } 

  loadRoles(): void {
    this.rol.getAll().subscribe(res => {
      this.roles = res.data;
    });
  }

  loadPermissions(): void {
    this.per.getAll().subscribe(res => {
      this.permissions = res.data;
    });
  }


  addRole(): void {
    this.role = new rolemodel();  
    this.addingRole = true;
    this.editingRoleCode = null;  
  }

    addPermissions(): void {
    this.permission = new permissionmodel();  
    this.addingPermission = true;
    this.editingPermissionCode = null;  
  }

  saveRole(): void {
    if (!this.role.code || !this.role.libelle) return;

    this.rol.upsert(this.role).subscribe(() => {
      this.role = new rolemodel();
      this.addingRole = false;
      this.loadRoles();
      this.refreshpage();
    });
  }

  savePermission(): void {
    if (!this.permission.code || !this.permission.description) return;

    this.per.upsert(this.permission).subscribe(() => {
      this.permission = new permissionmodel();
      this.addingPermission = false;
      this.loadPermissions();
      this.refreshpage();
    });
  }

  cancelRole(): void {
    this.role = new rolemodel();
    this.addingRole = false;
    this.editingRoleCode = null;
  }

  
  cancelPermission(): void {
    this.permission = new permissionmodel();
    this.addingPermission = false;
    this.editingPermissionCode = null;
  }


  startEdit(r: rolemodel): void {
    this.editingRoleCode = r.code;
    this.role = { ...r }; 
    this.addingRole = false; 
    console.log(this.role);
  }

   startEditPermission(p: permissionmodel): void {
    this.editingPermissionCode = p.code;
    this.permission = { ...p }; 
    this.addingPermission = false; 
  }

  saveEdit(): void {
    if (!this.role.code || !this.role.libelle) return;

    this.rol.upsert(this.role).subscribe(() => {
      this.editingRoleCode = null;
      this.role = new rolemodel();
      this.loadRoles();
      this.refreshpage();
    });
  }

  saveEditPermission(): void {
    if (!this.permission.code || !this.permission.description) return;

    this.per.upsert(this.permission).subscribe(() => {
      this.editingPermissionCode = null;
      this.permission = new permissionmodel();
      this.loadPermissions();
      this.refreshpage();
    });
  }

  cancelEdit(): void {
    this.editingRoleCode = null;
    this.role = new rolemodel();
  }

   cancelEditPermission(): void {
    this.editingPermissionCode = null;
    this.permission = new permissionmodel();
  }


  deleteRole(code: string): void {
    this.rol.delete(code).subscribe(() => {
      this.loadRoles();
       this.refreshpage();
    });
  }

   deletePermission (code: string): void {
    this.per.delete(code).subscribe(() => {
      this.loadPermissions();
       this.refreshpage();
    });
  }
selectRole(role: rolemodel) {
   this.rolePermissions = [];

  if (this.selectedRole?.idrole === role.idrole) {
    // Si on reclique sur le même rôle, on désélectionne tout
    this.selectedRole = null;
    this.rolePermissions = [];
  } else {
    // Sinon on sélectionne le rôle et on recharge ses permissions
    this.selectedRole = role;
    this.rolePermissions = []; // **important** pour vider avant de charger
    

    this.rp.getPermissionsByRole(this.selectedRole.idrole)
      .subscribe(res => {
        this.rolePermissions = res.data[0].map((p: any) => p.idpermission.toString());
      });
  }
}

  //Gestion des permission du role 
 togglePermission(permissionCode: string, event: any) {
  if (!this.selectedRole) return;

  
  if (event.target.checked) {

    this.rp.upsert(
      {idrole : this.selectedRole.idrole,idpermission : permissionCode}
    ).subscribe(() => {
      this.rolePermissions.push(permissionCode);
    });
  } else {
    this.rp.delete(
      this.selectedRole.idrole,
      permissionCode
    ).subscribe(() => {
      this.rolePermissions =
        this.rolePermissions.filter(p => p !== permissionCode);
    });
  }
}

}

