import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperationCaisseComponent } from './operation-caisse.component';

describe('OperationCaisseComponent', () => {
  let component: OperationCaisseComponent;
  let fixture: ComponentFixture<OperationCaisseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperationCaisseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OperationCaisseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
