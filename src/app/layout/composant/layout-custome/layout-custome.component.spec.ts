import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayoutCustomeComponent } from './layout-custome.component';

describe('LayoutCustomeComponent', () => {
  let component: LayoutCustomeComponent;
  let fixture: ComponentFixture<LayoutCustomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutCustomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LayoutCustomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
