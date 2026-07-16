import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OperationJustifieeListComponent } from './operation-justifiee-list.component';

describe('OperationJustifieeListComponent', () => {
  let component: OperationJustifieeListComponent;
  let fixture: ComponentFixture<OperationJustifieeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperationJustifieeListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OperationJustifieeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
