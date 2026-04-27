import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterfaceDemandeUserComponent } from './interface-demande-user.component';

describe('InterfaceDemandeUserComponent', () => {
  let component: InterfaceDemandeUserComponent;
  let fixture: ComponentFixture<InterfaceDemandeUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterfaceDemandeUserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InterfaceDemandeUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
