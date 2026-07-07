import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterfaceSupervisorComponent } from './interface-supervisor.component';

describe('InterfaceSupervisorComponent', () => {
  let component: InterfaceSupervisorComponent;
  let fixture: ComponentFixture<InterfaceSupervisorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterfaceSupervisorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InterfaceSupervisorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
