import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TauxdeviseComponent } from './tauxdevise.component';

describe('TauxdeviseComponent', () => {
  let component: TauxdeviseComponent;
  let fixture: ComponentFixture<TauxdeviseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TauxdeviseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TauxdeviseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
