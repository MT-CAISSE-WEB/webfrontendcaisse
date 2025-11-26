import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NatureoperationComponent } from './natureoperation.component';

describe('NatureoperationComponent', () => {
  let component: NatureoperationComponent;
  let fixture: ComponentFixture<NatureoperationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NatureoperationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NatureoperationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
