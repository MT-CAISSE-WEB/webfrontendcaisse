import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BilletageModalComponent } from './billetage-modal.component';

describe('BilletageModalComponent', () => {
  let component: BilletageModalComponent;
  let fixture: ComponentFixture<BilletageModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BilletageModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BilletageModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
