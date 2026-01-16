import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperationPeriodeComponent } from './operation-periode.component';

describe('OperationPeriodeComponent', () => {
  let component: OperationPeriodeComponent;
  let fixture: ComponentFixture<OperationPeriodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperationPeriodeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OperationPeriodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
