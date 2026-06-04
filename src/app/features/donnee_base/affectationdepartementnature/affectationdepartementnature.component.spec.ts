import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AffectationDepartementNatureComponent } from './affectationdepartementnature.component';

describe('AffectationDepartementNatureComponent', () => {
  let component: AffectationDepartementNatureComponent;
  let fixture: ComponentFixture<AffectationDepartementNatureComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AffectationDepartementNatureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AffectationDepartementNatureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
