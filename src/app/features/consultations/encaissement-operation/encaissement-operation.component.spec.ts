import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EncaissementOperationComponent } from './encaissement-operation.component';

describe('EncaissementOperationComponent', () => {
  let component: EncaissementOperationComponent;
  let fixture: ComponentFixture<EncaissementOperationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EncaissementOperationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EncaissementOperationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
