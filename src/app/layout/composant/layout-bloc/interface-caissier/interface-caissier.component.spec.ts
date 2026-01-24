import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterfaceCaissierComponent } from './interface-caissier.component';

describe('InterfaceCaissierComponent', () => {
  let component: InterfaceCaissierComponent;
  let fixture: ComponentFixture<InterfaceCaissierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterfaceCaissierComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InterfaceCaissierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
